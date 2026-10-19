package usecase

import (
	"context"
	"fmt"
	"slices"
	"strings"

	"backend/internal/domain"
)

// ImportSource describes the document imported items come from, with the
// evidence for its licence (ADR 0013).
type ImportSource struct {
	Key        string `json:"key"`
	Title      string `json:"title"`
	Origin     string `json:"origin"`
	Licence    string `json:"licence"`
	Collection string `json:"collection"`
	URL        string `json:"url"`
	// RetrievedAt is a YYYY-MM-DD date; empty when unknown.
	RetrievedAt  string `json:"retrieved_at"`
	LicenceURL   string `json:"licence_url"`
	RawObjectKey string `json:"raw_object_key"`
	ContentHash  string `json:"content_hash"`
}

// ImportRow is one item in an import file.
type ImportRow struct {
	Line     int          `json:"-"`
	Source   ImportSource `json:"source"`
	Kind     string       `json:"kind"`
	Language string       `json:"language"`
	Category string       `json:"category"`
	Text     string       `json:"text"`
	// Position is the segment's order within its document, when known.
	Position *int `json:"position"`
}

// ImportBatch describes one run of an import. A dry run does everything a
// real import would and then rolls back, so its counts are exact.
type ImportBatch struct {
	FileName   string
	FileHash   string
	ImportedBy string
	DryRun     bool
}

// ImportResult counts what an import added. Rows already present are skipped.
// BatchID is the recorded import batch, 0 on a dry run.
type ImportResult struct {
	BatchID int64
	Sources int
	Items   int
	Skipped int
}

// ImportStore persists imports and admin changes.
type ImportStore interface {
	// ImportItems records the batch, upserts sources by key (keeping their
	// split) and inserts items, skipping ones already present, in one
	// transaction. A dry run rolls the transaction back.
	ImportItems(ctx context.Context, batch ImportBatch, rows []ImportRow) (ImportResult, error)
	// SetMemberLevel returns ErrNotFound when the volunteer isn't a member.
	SetMemberLevel(ctx context.Context, email, language, level string) error
}

// LanguageLister lists the languages imports are checked against.
type LanguageLister interface {
	ListLanguages(ctx context.Context) ([]domain.Language, error)
}

// Importer runs the Data Lab admin tasks behind cmd/datalab.
type Importer interface {
	ImportItems(ctx context.Context, batch ImportBatch, rows []ImportRow) (ImportResult, error)
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
func (im *importer) ImportItems(ctx context.Context, batch ImportBatch, rows []ImportRow) (ImportResult, error) {
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
	return im.store.ImportItems(ctx, batch, rows)
}

func (im *importer) SetMemberLevel(ctx context.Context, email, language, level string) error {
	switch level {
	case domain.LevelContributor, domain.LevelReviewer, domain.LevelLead:
	default:
		return invalid("level must be contributor, reviewer, or lead")
	}
	return im.store.SetMemberLevel(ctx, email, language, level)
}
