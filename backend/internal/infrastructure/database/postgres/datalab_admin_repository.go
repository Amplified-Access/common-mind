package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"

	"backend/internal/domain"
	"backend/internal/usecase"
)

type dataLabAdminRepository struct{ db *sql.DB }

// NewDataLabAdminRepository returns a usecase.DataLabAdminStore backed by PostgreSQL.
func NewDataLabAdminRepository(db *sql.DB) usecase.DataLabAdminStore {
	return &dataLabAdminRepository{db: db}
}

// ListTranslators counts each volunteer's contributions by modality and
// status, and the reviews they made, in one pass over their contributions.
// Their languages each carry their contributions in that language, across
// every language whatever the filter, busiest first.
// $1 is the language (” for all), $2 the volunteer's ID (0 for all).
func (r *dataLabAdminRepository) ListTranslators(ctx context.Context, f usecase.TranslatorFilter) ([]domain.Translator, error) {
	const q = `
        WITH their_reviews AS (
            SELECT rv.reviewer_id, count(*) AS n, max(rv.created_at) AS last_at
            FROM reviews rv JOIN contributions rc ON rc.id = rv.contribution_id
            WHERE $1 = '' OR rc.language_code = $1
            GROUP BY rv.reviewer_id
        )
        SELECT u.id, u.name, u.email, u.created_at,
               COALESCE((SELECT json_agg(json_build_object('language_code', l.code, 'level', l.level, 'contributions', l.n)
                                         ORDER BY l.n DESC, l.code)
                         FROM (SELECT lang.code, COALESCE(m.level, '') AS level,
                                      (SELECT count(*) FROM contributions cc
                                       WHERE cc.contributor_id = u.id AND cc.language_code = lang.code) AS n
                               FROM (SELECT language_code AS code FROM language_members WHERE user_id = u.id
                                     UNION
                                     SELECT language_code FROM contributions WHERE contributor_id = u.id) lang
                               LEFT JOIN language_members m ON m.user_id = u.id AND m.language_code = lang.code) l), '[]'),
               count(c.id) FILTER (WHERE c.modality = 'text'),
               count(c.id) FILTER (WHERE c.modality = 'audio'),
               count(c.id) FILTER (WHERE c.modality = 'video'),
               count(c.id) FILTER (WHERE c.status = 'pending'),
               count(c.id) FILTER (WHERE c.status = 'verified'),
               count(c.id) FILTER (WHERE r.decision = 'correct'),
               count(c.id) FILTER (WHERE c.status = 'rejected'),
               COALESCE(max(tr.n), 0),
               GREATEST(max(c.created_at), max(tr.last_at))
        FROM users u
        LEFT JOIN contributions c ON c.contributor_id = u.id AND ($1 = '' OR c.language_code = $1)
        LEFT JOIN reviews r ON r.contribution_id = c.id
        LEFT JOIN their_reviews tr ON tr.reviewer_id = u.id
        WHERE ($2 = 0 OR u.id = $2)
          AND (EXISTS (SELECT 1 FROM language_members m WHERE m.user_id = u.id AND ($1 = '' OR m.language_code = $1))
               OR EXISTS (SELECT 1 FROM contributions c2 WHERE c2.contributor_id = u.id AND ($1 = '' OR c2.language_code = $1)))
        GROUP BY u.id
        ORDER BY count(c.id) DESC, u.name, u.id`

	rows, err := r.db.QueryContext(ctx, q, f.Language, f.ID)
	if err != nil {
		return nil, fmt.Errorf("datalab admin repository: list translators: %w", err)
	}
	defer rows.Close()

	out := []domain.Translator{}
	for rows.Next() {
		var t domain.Translator
		var languages []byte
		var lastActive sql.NullTime
		if err := rows.Scan(&t.ID, &t.Name, &t.Email, &t.JoinedAt, &languages,
			&t.Written, &t.Recorded, &t.Signed, &t.Pending, &t.Verified, &t.Corrected, &t.Rejected,
			&t.Reviewed, &lastActive); err != nil {
			return nil, fmt.Errorf("datalab admin repository: scan translator: %w", err)
		}
		if err := json.Unmarshal(languages, &t.Languages); err != nil {
			return nil, fmt.Errorf("datalab admin repository: decode languages: %w", err)
		}
		if lastActive.Valid {
			t.LastActiveAt = &lastActive.Time
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// contributionsWhere is the filter both contribution queries share:
// $1 contributor (0 for all), $2 language, $3 status, $4 modality (” for all).
const contributionsWhere = `
        WHERE ($1 = 0 OR c.contributor_id = $1)
          AND ($2 = '' OR c.language_code = $2)
          AND ($3 = '' OR c.status = $3)
          AND ($4 = '' OR c.modality = $4)`

// ListContributions returns a page of contributions with their item, source,
// review and reviewer. A recording's ReadText is the verified text of the
// translation it reads: the reviewer's correction when there is one.
func (r *dataLabAdminRepository) ListContributions(ctx context.Context, f usecase.ContributionFilter) (*domain.AdminContributionPage, error) {
	args := []any{f.ContributorID, f.Language, f.Status, f.Modality}

	page := &domain.AdminContributionPage{Contributions: []domain.AdminContribution{}}
	if err := r.db.QueryRowContext(ctx, `SELECT count(*) FROM contributions c`+contributionsWhere, args...).Scan(&page.Total); err != nil {
		return nil, fmt.Errorf("datalab admin repository: count contributions: %w", err)
	}

	q := `
        SELECT c.id, c.contributor_id, u.name, c.item_id, i.kind, i.category, s.title,
               i.text, i.language_code, c.language_code, c.modality, c.text,
               COALESCE(read_review.corrected_text, read.text, ''), COALESCE(c.audio_key, ''), COALESCE(c.video_key, ''),
               c.pasted, c.status, c.created_at,
               r.decision, COALESCE(r.reason, ''), COALESCE(r.note, ''), COALESCE(r.corrected_text, ''),
               r.reviewer_id, COALESCE(reviewer.name, ''), r.created_at
        FROM contributions c
        JOIN users u ON u.id = c.contributor_id
        JOIN items i ON i.id = c.item_id
        JOIN sources s ON s.id = i.source_id
        LEFT JOIN contributions read ON read.id = c.reads_contribution_id
        LEFT JOIN reviews read_review ON read_review.contribution_id = read.id
        LEFT JOIN reviews r ON r.contribution_id = c.id
        LEFT JOIN users reviewer ON reviewer.id = r.reviewer_id` + contributionsWhere + `
        ORDER BY c.created_at DESC, c.id DESC
        LIMIT $5 OFFSET $6`

	rows, err := r.db.QueryContext(ctx, q, append(args, f.Limit, f.Offset)...)
	if err != nil {
		return nil, fmt.Errorf("datalab admin repository: list contributions: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var c domain.AdminContribution
		var decision sql.NullString
		var reviewerID sql.NullInt64
		var reviewedAt sql.NullTime
		var rv domain.AdminReview
		if err := rows.Scan(&c.ID, &c.ContributorID, &c.ContributorName, &c.ItemID, &c.Kind, &c.Category, &c.SourceTitle,
			&c.ItemText, &c.ItemLanguage, &c.LanguageCode, &c.Modality, &c.Text,
			&c.ReadText, &c.AudioKey, &c.VideoKey, &c.Pasted, &c.Status, &c.SubmittedAt,
			&decision, &rv.Reason, &rv.Note, &rv.CorrectedText,
			&reviewerID, &rv.ReviewerName, &reviewedAt); err != nil {
			return nil, fmt.Errorf("datalab admin repository: scan contribution: %w", err)
		}
		if c.Modality != domain.ModalityAudio {
			c.ReadText = ""
		}
		if decision.Valid {
			rv.Decision, rv.ReviewerID, rv.ReviewedAt = decision.String, reviewerID.Int64, reviewedAt.Time
			c.Review = &rv
		}
		page.Contributions = append(page.Contributions, c)
	}
	return page, rows.Err()
}
