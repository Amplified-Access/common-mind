package usecase

import (
	"context"
	"fmt"
	"slices"
	"strings"

	"backend/internal/domain"
)

// ImportSource describes where imported items come from.
type ImportSource struct {
	Key     string `json:"key"`
	Title   string `json:"title"`
	Origin  string `json:"origin"`
	Licence string `json:"licence"`
}

// ImportRow is one item in an import file.
type ImportRow struct {
	Line     int          `json:"-"`
	Source   ImportSource `json:"source"`
	Kind     string       `json:"kind"`
	Language string       `json:"language"`
	Category string       `json:"category"`
	Text     string       `json:"text"`
}

// ImportResult counts what an import added. Rows already present are skipped.
type ImportResult struct {
	Sources int
	Items   int
	Skipped int
}

// ImportStore persists imports and admin changes.
type ImportStore interface {
	// ImportItems upserts sources by key (keeping their split) and inserts
	// items, skipping ones already present, in one transaction.
	ImportItems(ctx context.Context, rows []ImportRow) (ImportResult, error)
	// SetMemberLevel returns ErrNotFound when the volunteer isn't a member.
	SetMemberLevel(ctx context.Context, email, language, level string) error
}

// LanguageLister lists the languages imports are checked against.
type LanguageLister interface {
	ListLanguages(ctx context.Context) ([]domain.Language, error)
}

// Importer runs the Data Lab admin tasks behind cmd/datalab.
type Importer interface {
	ImportItems(ctx context.Context, rows []ImportRow) (ImportResult, error)
	SetMemberLevel(ctx context.Context, email, language, level string) error
}

type importer struct {
	store ImportStore
	langs LanguageLister
}

// NewImporter constructs the admin use case.
func NewImporter(store ImportStore, langs LanguageLister) Importer {
	return &importer{store: store, langs: langs}
}

// ImportItems validates every row before writing any, and reports all the
// bad lines at once so a file can be fixed in one pass.
func (im *importer) ImportItems(ctx context.Context, rows []ImportRow) (ImportResult, error) {
	langs, err := im.langs.ListLanguages(ctx)
	if err != nil {
		return ImportResult{}, err
	}
	sourceLangs := map[string]bool{}
	for _, l := range langs {
		if l.Role == domain.LanguageRoleSource {
			sourceLangs[l.Code] = true
		}
	}

	var problems []string
	for i := range rows {
		r := &rows[i]
		r.Text = strings.TrimSpace(r.Text)
		var p []string
		if r.Source.Key == "" || r.Source.Title == "" || r.Source.Licence == "" {
			p = append(p, "source needs key, title, and licence")
		}
		if r.Kind != domain.KindTranslate && r.Kind != domain.KindWrite {
			p = append(p, fmt.Sprintf("kind %q is not translate or write", r.Kind))
		}
		if !sourceLangs[r.Language] {
			p = append(p, fmt.Sprintf("language %q is not a source language", r.Language))
		}
		if !slices.Contains(domain.CivicCategories, r.Category) {
			p = append(p, fmt.Sprintf("category %q is not a civic category", r.Category))
		}
		if r.Text == "" {
			p = append(p, "text is empty")
		}
		if len(p) > 0 {
			problems = append(problems, fmt.Sprintf("line %d: %s", r.Line, strings.Join(p, "; ")))
		}
	}
	if len(problems) > 0 {
		return ImportResult{}, invalid(strings.Join(problems, "\n"))
	}
	return im.store.ImportItems(ctx, rows)
}

func (im *importer) SetMemberLevel(ctx context.Context, email, language, level string) error {
	switch level {
	case domain.LevelContributor, domain.LevelReviewer, domain.LevelLead:
	default:
		return invalid("level must be contributor, reviewer, or lead")
	}
	return im.store.SetMemberLevel(ctx, email, language, level)
}
