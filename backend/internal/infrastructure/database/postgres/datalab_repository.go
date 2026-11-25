package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"

	"backend/internal/domain"
	"backend/internal/usecase"
)

type dataLabRepository struct{ db *sql.DB }

// NewDataLabRepository returns a usecase.DataLabStore backed by PostgreSQL.
func NewDataLabRepository(db *sql.DB) usecase.DataLabStore {
	return &dataLabRepository{db: db}
}

// ListLanguages returns enabled languages, target languages first.
func (r *dataLabRepository) ListLanguages(ctx context.Context) ([]domain.Language, error) {
	const q = `
        SELECT code, name, native_name, role, script, array_to_json(extra_characters), modality
        FROM languages
        WHERE enabled
        ORDER BY role = 'source', name`

	rows, err := r.db.QueryContext(ctx, q)
	if err != nil {
		return nil, fmt.Errorf("datalab repository: list languages: %w", err)
	}
	defer rows.Close()

	var out []domain.Language
	for rows.Next() {
		var l domain.Language
		var extra []byte
		if err := rows.Scan(&l.Code, &l.Name, &l.NativeName, &l.Role, &l.Script, &extra, &l.Modality); err != nil {
			return nil, fmt.Errorf("datalab repository: scan language: %w", err)
		}
		if err := json.Unmarshal(extra, &l.ExtraCharacters); err != nil {
			return nil, fmt.Errorf("datalab repository: decode extra characters: %w", err)
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

// GetVolunteer loads a user's Data Lab profile: their memberships, the latest
// consent version they accepted, and whether it covers voice and video.
// Returns nil, nil for unknown users.
func (r *dataLabRepository) GetVolunteer(ctx context.Context, firebaseUID string) (*domain.Volunteer, error) {
	const q = `
        SELECT u.id, u.name, u.email,
               COALESCE((SELECT version FROM consents c WHERE c.user_id = u.id
                         ORDER BY accepted_at DESC LIMIT 1), ''),
               COALESCE((SELECT covers_voice FROM consents c WHERE c.user_id = u.id
                         ORDER BY accepted_at DESC LIMIT 1), false),
               COALESCE((SELECT covers_video FROM consents c WHERE c.user_id = u.id
                         ORDER BY accepted_at DESC LIMIT 1), false),
               COALESCE((SELECT json_agg(json_build_object('language_code', m.language_code, 'level', m.level,
                                                           'modality', l.modality)
                                         ORDER BY m.language_code)
                         FROM language_members m JOIN languages l ON l.code = m.language_code
                         WHERE m.user_id = u.id), '[]')
        FROM users u
        WHERE u.firebase_uid = $1`

	v := &domain.Volunteer{}
	var memberships []byte
	err := r.db.QueryRowContext(ctx, q, firebaseUID).
		Scan(&v.ID, &v.Name, &v.Email, &v.ConsentVersion, &v.VoiceConsent, &v.VideoConsent, &memberships)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("datalab repository: get volunteer: %w", err)
	}
	if err := json.Unmarshal(memberships, &v.Languages); err != nil {
		return nil, fmt.Errorf("datalab repository: decode memberships: %w", err)
	}
	return v, nil
}

func (r *dataLabRepository) SaveOnboarding(ctx context.Context, rec usecase.OnboardingRecord) (*domain.Volunteer, error) {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("datalab repository: begin onboarding: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	var userID int64
	err = tx.QueryRowContext(ctx, `
        INSERT INTO users (firebase_uid, name, email, photo_url)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (firebase_uid) DO UPDATE
            SET name = EXCLUDED.name, email = EXCLUDED.email,
                photo_url = EXCLUDED.photo_url, updated_at = now()
        RETURNING id`,
		rec.FirebaseUID, rec.Name, rec.Email, rec.PhotoURL).Scan(&userID)
	if err != nil {
		return nil, fmt.Errorf("datalab repository: upsert user: %w", err)
	}

	// DO NOTHING keeps an existing membership's level: onboarding again adds
	// languages, never demotes.
	if _, err := tx.ExecContext(ctx, `
        INSERT INTO language_members (user_id, language_code)
        SELECT $1, unnest($2::text[])
        ON CONFLICT (user_id, language_code) DO NOTHING`,
		userID, rec.Languages); err != nil {
		return nil, fmt.Errorf("datalab repository: add memberships: %w", err)
	}

	if _, err := tx.ExecContext(ctx, `
        INSERT INTO consents (user_id, version) VALUES ($1, $2)
        ON CONFLICT (user_id, version) DO NOTHING`,
		userID, rec.ConsentVersion); err != nil {
		return nil, fmt.Errorf("datalab repository: record consent: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("datalab repository: commit onboarding: %w", err)
	}
	return r.GetVolunteer(ctx, rec.FirebaseUID)
}

func (r *dataLabRepository) SaveVoiceConsent(ctx context.Context, userID int64, version string) error {
	if _, err := r.db.ExecContext(ctx, `
        UPDATE consents SET covers_voice = true WHERE user_id = $1 AND version = $2`,
		userID, version); err != nil {
		return fmt.Errorf("datalab repository: save voice consent: %w", err)
	}
	return nil
}

func (r *dataLabRepository) SaveVideoConsent(ctx context.Context, userID int64, version string) error {
	if _, err := r.db.ExecContext(ctx, `
        UPDATE consents SET covers_video = true WHERE user_id = $1 AND version = $2`,
		userID, version); err != nil {
		return fmt.Errorf("datalab repository: save video consent: %w", err)
	}
	return nil
}

// verifiedText is a written contribution's verified text: the reviewer's
// correction when there is one. Use with `c` a contribution.
const verifiedText = `COALESCE((SELECT rv.corrected_text FROM reviews rv WHERE rv.contribution_id = c.id), c.text)`

// NextItem picks at random among open items so volunteers working the same
// language at once rarely get the same one. An item is open in a language
// and modality until it has a pending or verified contribution there; a
// rejected one reopens it for everyone except the volunteer who was rejected.
//
// Writing works from the source text; words are for signing only. Recording
// reads a verified translation aloud, so only items translated and verified
// in the language are offered, and the task's text is that translation, in
// the language. Signing works from the source text too: words first, since
// single signs feed the /sign lexicon, then sentences (ADR 0014).
//
// Retired items (ADR 0013) are never offered, in either modality.
func (r *dataLabRepository) NextItem(ctx context.Context, userID int64, language, modality string) (*domain.Task, error) {
	const open = `
          NOT EXISTS (
              SELECT 1 FROM contributions o
              WHERE o.item_id = i.id AND o.language_code = $2 AND o.modality = $3
                AND (o.status IN ('pending', 'verified') OR o.contributor_id = $1))`
	q := `
        SELECT i.id, i.kind, i.category, i.text, i.language_code
        FROM items i
        WHERE i.status = 'active' AND i.kind <> 'word' AND i.language_code <> $2 AND` + open + `
        ORDER BY random()
        LIMIT 1`
	switch modality {
	case domain.ModalityVideo:
		q = `
        SELECT i.id, i.kind, i.category, i.text, i.language_code
        FROM items i
        WHERE i.status = 'active' AND i.kind IN ('word', 'translate') AND i.language_code <> $2 AND` + open + `
        ORDER BY i.kind = 'word' DESC, random()
        LIMIT 1`
	case domain.ModalityAudio:
		q = `
        SELECT i.id, i.kind, i.category, ` + verifiedText + `, c.language_code
        FROM items i
        JOIN contributions c ON c.item_id = i.id AND c.language_code = $2
                            AND c.modality = 'text' AND c.status = 'verified'
        WHERE i.status = 'active' AND i.kind = 'translate' AND` + open + `
        ORDER BY random()
        LIMIT 1`
	}

	t := &domain.Task{TargetLanguage: language, Modality: modality}
	err := r.db.QueryRowContext(ctx, q, userID, language, modality).
		Scan(&t.ItemID, &t.Kind, &t.Category, &t.Text, &t.TextLanguage)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("datalab repository: next item: %w", err)
	}
	return t, nil
}

func (r *dataLabRepository) VerifiedTranslation(ctx context.Context, itemID int64, language string) (int64, error) {
	var id int64
	err := r.db.QueryRowContext(ctx, `
        SELECT c.id FROM contributions c JOIN items i ON i.id = c.item_id
        WHERE c.item_id = $1 AND c.language_code = $2 AND i.kind = 'translate'
          AND c.modality = 'text' AND c.status = 'verified'
        LIMIT 1`, itemID, language).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, nil
	}
	if err != nil {
		return 0, fmt.Errorf("datalab repository: verified translation: %w", err)
	}
	return id, nil
}

func (r *dataLabRepository) CreateContribution(ctx context.Context, rec usecase.ContributionRecord) (*domain.Contribution, error) {
	const q = `
        INSERT INTO contributions (item_id, language_code, contributor_id, modality, text, audio_key,
                                   reads_contribution_id, pasted, consent_version, video_key, landmarks_key)
        VALUES ($1, $2, $3, $4, $5, NULLIF($6, ''), NULLIF($7, 0), $8, $9, NULLIF($10, ''), NULLIF($11, ''))
        RETURNING id, item_id, language_code, modality, text, COALESCE(audio_key, ''),
                  COALESCE(video_key, ''), COALESCE(landmarks_key, ''), pasted, status, created_at`

	c := &domain.Contribution{}
	err := r.db.QueryRowContext(ctx, q, rec.ItemID, rec.Language, rec.ContributorID, rec.Modality, rec.Text,
		rec.AudioKey, rec.ReadsContributionID, rec.Pasted, rec.ConsentVersion, rec.VideoKey, rec.LandmarksKey).
		Scan(&c.ID, &c.ItemID, &c.LanguageCode, &c.Modality, &c.Text, &c.AudioKey, &c.VideoKey, &c.LandmarksKey,
			&c.Pasted, &c.Status, &c.CreatedAt)
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505": // unique_violation: same volunteer, item, language, and modality
			return nil, usecase.ErrAlreadyContributed
		case "23503": // foreign_key_violation: unknown item
			return nil, usecase.ErrNotFound
		}
	}
	if err != nil {
		return nil, fmt.Errorf("datalab repository: create contribution: %w", err)
	}
	return c, nil
}

// NextPendingContribution serves the oldest first, so nothing waits forever.
func (r *dataLabRepository) NextPendingContribution(ctx context.Context, reviewerID int64, language string) (*domain.ReviewItem, error) {
	const q = `
        SELECT c.id, i.kind, i.category, i.text, i.language_code,
               c.language_code, c.modality, c.text,
               COALESCE((SELECT COALESCE(rv.corrected_text, rd.text)
                         FROM contributions rd LEFT JOIN reviews rv ON rv.contribution_id = rd.id
                         WHERE rd.id = c.reads_contribution_id), ''),
               COALESCE(c.audio_key, ''), COALESCE(c.video_key, ''), COALESCE(c.landmarks_key, ''),
               c.pasted, c.created_at
        FROM contributions c
        JOIN items i ON i.id = c.item_id
        WHERE c.language_code = $2 AND c.status = 'pending' AND c.contributor_id <> $1
        ORDER BY c.created_at, c.id
        LIMIT 1`

	it := &domain.ReviewItem{}
	err := r.db.QueryRowContext(ctx, q, reviewerID, language).Scan(
		&it.ContributionID, &it.Kind, &it.Category, &it.ItemText, &it.ItemLanguage,
		&it.LanguageCode, &it.Modality, &it.Text, &it.ReadText, &it.AudioKey, &it.VideoKey, &it.LandmarksKey,
		&it.Pasted, &it.SubmittedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("datalab repository: next pending contribution: %w", err)
	}
	return it, nil
}

func (r *dataLabRepository) GetContributionRef(ctx context.Context, id int64) (*domain.ContributionRef, error) {
	ref := &domain.ContributionRef{}
	err := r.db.QueryRowContext(ctx, `
        SELECT id, language_code, contributor_id, status, modality, text FROM contributions WHERE id = $1`, id).
		Scan(&ref.ID, &ref.LanguageCode, &ref.ContributorID, &ref.Status, &ref.Modality, &ref.Text)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, usecase.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("datalab repository: get contribution: %w", err)
	}
	return ref, nil
}

func (r *dataLabRepository) SaveReview(ctx context.Context, rec usecase.ReviewRecord) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("datalab repository: begin review: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	// Only a pending contribution changes status; zero rows means another
	// reviewer got there first.
	res, err := tx.ExecContext(ctx, `
        UPDATE contributions SET status = $2, updated_at = now()
        WHERE id = $1 AND status = 'pending'`, rec.ContributionID, rec.Status)
	if err != nil {
		return fmt.Errorf("datalab repository: update contribution status: %w", err)
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return usecase.ErrAlreadyReviewed
	}

	if _, err := tx.ExecContext(ctx, `
        INSERT INTO reviews (contribution_id, reviewer_id, decision, reason, note, corrected_text)
        VALUES ($1, $2, $3, NULLIF($4, ''), $5, NULLIF($6, ''))`,
		rec.ContributionID, rec.ReviewerID, rec.Decision, rec.Reason, rec.Note, rec.CorrectedText); err != nil {
		return fmt.Errorf("datalab repository: insert review: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("datalab repository: commit review: %w", err)
	}
	return nil
}

// Progress computes live counts per target language. Sentence pairs are
// written contributions to translate items; recordings and signs are counted
// apart. A sign language has words and sentences available to sign.
// Open is derived from the reviewer count with the same rule the use case
// enforces.
func (r *dataLabRepository) Progress(ctx context.Context, language string) ([]domain.LanguageProgress, error) {
	const q = `
        SELECT l.code,
               (SELECT count(*) FROM items i
                WHERE i.language_code <> l.code
                  AND (i.kind = 'translate' OR (l.modality = 'signed' AND i.kind = 'word'))),
               (SELECT count(*) FROM contributions c JOIN items i ON i.id = c.item_id
                WHERE c.language_code = l.code AND i.kind = 'translate' AND c.modality = 'text'
                  AND c.status IN ('pending', 'verified')),
               (SELECT count(*) FROM contributions c JOIN items i ON i.id = c.item_id
                WHERE c.language_code = l.code AND i.kind = 'translate' AND c.modality = 'text'
                  AND c.status = 'verified'),
               (SELECT count(*) FROM contributions c
                WHERE c.language_code = l.code AND c.modality = 'audio' AND c.status IN ('pending', 'verified')),
               (SELECT count(*) FROM contributions c
                WHERE c.language_code = l.code AND c.modality = 'audio' AND c.status = 'verified'),
               (SELECT count(*) FROM contributions c
                WHERE c.language_code = l.code AND c.modality = 'video' AND c.status IN ('pending', 'verified')),
               (SELECT count(*) FROM contributions c
                WHERE c.language_code = l.code AND c.modality = 'video' AND c.status = 'verified'),
               (SELECT count(*) FROM contributions c WHERE c.language_code = l.code AND c.status = 'pending')
        FROM languages l
        WHERE l.role = 'target' AND l.enabled AND ($1 = '' OR l.code = $1)
        ORDER BY l.name`

	rows, err := r.db.QueryContext(ctx, q, language)
	if err != nil {
		return nil, fmt.Errorf("datalab repository: progress: %w", err)
	}
	defer rows.Close()

	var out []domain.LanguageProgress
	for rows.Next() {
		var p domain.LanguageProgress
		if err := rows.Scan(&p.Code, &p.Available, &p.Translated, &p.Verified, &p.Recorded, &p.RecordedVerified,
			&p.Signed, &p.SignedVerified, &p.Pending); err != nil {
			return nil, fmt.Errorf("datalab repository: scan progress: %w", err)
		}
		out = append(out, p)
	}
	return out, rows.Err()
}
