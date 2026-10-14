package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

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
        SELECT code, name, native_name, role, script, array_to_json(extra_characters)
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
		if err := rows.Scan(&l.Code, &l.Name, &l.NativeName, &l.Role, &l.Script, &extra); err != nil {
			return nil, fmt.Errorf("datalab repository: scan language: %w", err)
		}
		if err := json.Unmarshal(extra, &l.ExtraCharacters); err != nil {
			return nil, fmt.Errorf("datalab repository: decode extra characters: %w", err)
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

// GetVolunteer loads a user's Data Lab profile: their memberships and the
// latest consent version they accepted. Returns nil, nil for unknown users.
func (r *dataLabRepository) GetVolunteer(ctx context.Context, firebaseUID string) (*domain.Volunteer, error) {
	const q = `
        SELECT u.id, u.name, u.email,
               COALESCE((SELECT version FROM consents c WHERE c.user_id = u.id
                         ORDER BY accepted_at DESC LIMIT 1), ''),
               COALESCE((SELECT json_agg(json_build_object('language_code', m.language_code, 'level', m.level)
                                         ORDER BY m.language_code)
                         FROM language_members m WHERE m.user_id = u.id), '[]')
        FROM users u
        WHERE u.firebase_uid = $1`

	v := &domain.Volunteer{}
	var memberships []byte
	err := r.db.QueryRowContext(ctx, q, firebaseUID).
		Scan(&v.ID, &v.Name, &v.Email, &v.ConsentVersion, &memberships)
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
