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

// ImportItems records the batch first, so every item can point at it, and
// fills in its counts at the end. A dry run does the same work and rolls
// back, so the counts it returns are what a real import would do.
func (r *importRepository) ImportItems(ctx context.Context, batch usecase.ImportBatch, rows []usecase.ImportRow) (usecase.ImportResult, error) {
	var res usecase.ImportResult
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return res, fmt.Errorf("import repository: begin: %w", err)
	}
	defer func() { _ = tx.Rollback() }()

	var batchID int64
	err = tx.QueryRowContext(ctx, `
        INSERT INTO import_batches (file_name, file_hash, imported_by, sources_added, items_added, items_skipped)
        VALUES ($1, $2, $3, 0, 0, 0)
        RETURNING id`,
		batch.FileName, batch.FileHash, batch.ImportedBy).Scan(&batchID)
	if err != nil {
		return res, fmt.Errorf("import repository: insert batch: %w", err)
	}

	sourceIDs := map[string]int64{}
	for _, row := range rows {
		src := row.Source
		id, ok := sourceIDs[src.Key]
		if !ok {
			// The split is set on first insert only; an existing source keeps its own.
			var inserted bool
			err := tx.QueryRowContext(ctx, `
                INSERT INTO sources (key, title, origin, licence, split, collection, url, retrieved_at,
                                     licence_url, raw_object_key, content_hash)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NULLIF($8, '')::date, $9, $10, $11)
                ON CONFLICT (key) DO UPDATE
                    SET title = EXCLUDED.title, origin = EXCLUDED.origin, licence = EXCLUDED.licence,
                        collection = EXCLUDED.collection, url = EXCLUDED.url,
                        retrieved_at = EXCLUDED.retrieved_at, licence_url = EXCLUDED.licence_url,
                        raw_object_key = EXCLUDED.raw_object_key, content_hash = EXCLUDED.content_hash
                RETURNING id, (xmax = 0)`,
				src.Key, src.Title, src.Origin, src.Licence, domain.SplitFor(src.Key), src.Collection, src.URL,
				src.RetrievedAt, src.LicenceURL, src.RawObjectKey, src.ContentHash).
				Scan(&id, &inserted)
			if err != nil {
				return res, fmt.Errorf("import repository: upsert source %q: %w", src.Key, err)
			}
			if inserted {
				res.Sources++
			}
			sourceIDs[src.Key] = id
		}

		out, err := tx.ExecContext(ctx, `
            INSERT INTO items (source_id, kind, language_code, category, text, position, import_batch_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (source_id, kind, md5(text)) DO NOTHING`,
			id, row.Kind, row.Language, row.Category, row.Text, row.Position, batchID)
		if err != nil {
			return res, fmt.Errorf("import repository: insert item: %w", err)
		}
		if n, _ := out.RowsAffected(); n == 1 {
			res.Items++
		} else {
			res.Skipped++
		}
	}

	_, err = tx.ExecContext(ctx, `
        UPDATE import_batches SET sources_added = $2, items_added = $3, items_skipped = $4
        WHERE id = $1`,
		batchID, res.Sources, res.Items, res.Skipped)
	if err != nil {
		return res, fmt.Errorf("import repository: update batch counts: %w", err)
	}

	if batch.DryRun {
		if err := tx.Rollback(); err != nil {
			return res, fmt.Errorf("import repository: roll back dry run: %w", err)
		}
		return res, nil
	}
	if err := tx.Commit(); err != nil {
		return res, fmt.Errorf("import repository: commit: %w", err)
	}
	res.BatchID = batchID
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
