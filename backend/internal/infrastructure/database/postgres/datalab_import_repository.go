package postgres

import (
	"context"
	"database/sql"
	"fmt"

	"backend/internal/domain"
	"backend/internal/usecase"
)

type importRepository struct{ db *sql.DB }

// NewImportRepository returns a usecase.ImportStore backed by PostgreSQL.
func NewImportRepository(db *sql.DB) usecase.ImportStore {
	return &importRepository{db: db}
}

func (r *importRepository) ImportItems(ctx context.Context, rows []usecase.ImportRow) (usecase.ImportResult, error) {
	var res usecase.ImportResult
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return res, fmt.Errorf("import repository: begin: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	sourceIDs := map[string]int64{}
	for _, row := range rows {
		id, ok := sourceIDs[row.Source.Key]
		if !ok {
			// The split is set on first insert only; an existing source keeps its own.
			var inserted bool
			err := tx.QueryRowContext(ctx, `
                INSERT INTO sources (key, title, origin, licence, split)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (key) DO UPDATE
                    SET title = EXCLUDED.title, origin = EXCLUDED.origin, licence = EXCLUDED.licence
                RETURNING id, (xmax = 0)`,
				row.Source.Key, row.Source.Title, row.Source.Origin, row.Source.Licence, domain.SplitFor(row.Source.Key)).
				Scan(&id, &inserted)
			if err != nil {
				return res, fmt.Errorf("import repository: upsert source %q: %w", row.Source.Key, err)
			}
			if inserted {
				res.Sources++
			}
			sourceIDs[row.Source.Key] = id
		}

		out, err := tx.ExecContext(ctx, `
            INSERT INTO items (source_id, kind, language_code, category, text)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (source_id, kind, md5(text)) DO NOTHING`,
			id, row.Kind, row.Language, row.Category, row.Text)
		if err != nil {
			return res, fmt.Errorf("import repository: insert item: %w", err)
		}
		if n, _ := out.RowsAffected(); n == 1 {
			res.Items++
		} else {
			res.Skipped++
		}
	}

	if err := tx.Commit(); err != nil {
		return res, fmt.Errorf("import repository: commit: %w", err)
	}
	return res, nil
}

func (r *importRepository) SetMemberLevel(ctx context.Context, email, language, level string) error {
	out, err := r.db.ExecContext(ctx, `
        UPDATE language_members m SET level = $3, updated_at = now()
        FROM users u
        WHERE m.user_id = u.id AND u.email = $1 AND m.language_code = $2`,
		email, language, level)
	if err != nil {
		return fmt.Errorf("import repository: set member level: %w", err)
	}
	if n, _ := out.RowsAffected(); n == 0 {
		return usecase.ErrNotFound
	}
	return nil
}
