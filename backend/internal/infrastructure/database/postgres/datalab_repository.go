package postgres

import (
	"context"
	"database/sql"
	"encoding/json"
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
