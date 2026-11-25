package usecase

import (
	"context"
	"errors"
	"strconv"
	"strings"
	"testing"

	"backend/internal/domain"
)

type fakeImportStore struct{ imported []ImportRow }

func (f *fakeImportStore) ImportItems(_ context.Context, _ ImportBatch, rows []ImportRow) (ImportResult, error) {
	f.imported = rows
	return ImportResult{Items: len(rows)}, nil
}

func (f *fakeImportStore) SetMemberLevel(context.Context, string, string, string) error { return nil }

func TestImportItems_ReportsEveryBadLineAndWritesNothing(t *testing.T) {
	src := ImportSource{Key: "council-notices-2026", Title: "Council notices", Licence: "CC-BY-4.0"}
	rows := []ImportRow{
		{Line: 1, Source: src, Kind: domain.KindTranslate, Language: "en", Category: "public-services", Text: "The clinic opens at eight."},
		{Line: 2, Source: src, Kind: "summarise", Language: "en", Category: "public-services", Text: "x"},
		{Line: 3, Source: src, Kind: domain.KindWrite, Language: "sw", Category: "elections", Text: "x"},
		{Line: 4, Source: src, Kind: domain.KindWrite, Language: "en", Category: "weather", Text: "x"},
		{Line: 5, Source: ImportSource{Key: "no-licence", Title: "x"}, Kind: domain.KindWrite, Language: "en", Category: "elections", Text: "x"},
		{Line: 6, Source: src, Kind: domain.KindWrite, Language: "en", Category: "elections", Text: "  "},
		// A word for signers to sign (ADR 0014).
		{Line: 7, Source: src, Kind: domain.KindWord, Language: "en", Category: "public-services", Text: "clinic"},
	}
	store := &fakeImportStore{}
	langs := &fakeStore{languages: launchLanguages()}

	_, err := NewImporter(store, langs).ImportItems(context.Background(), ImportBatch{}, rows)

	if !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("error = %v, want ErrInvalidInput", err)
	}
	for _, line := range []string{"line 2", "line 3", "line 4", "line 5", "line 6"} {
		if !strings.Contains(err.Error(), line) {
			t.Errorf("error %q does not mention %s", err, line)
		}
	}
	for _, line := range []string{"line 1:", "line 7:"} {
		if strings.Contains(err.Error(), line) {
			t.Errorf("error %q flags the valid %s", err, line)
		}
	}
	if store.imported != nil {
		t.Error("rows written despite errors")
	}
}

func TestImportItems_ChecksLicenceAndEvidence(t *testing.T) {
	minus := -1
	zero := 0
	tests := []struct {
		name    string
		edit    func(r *ImportRow)
		problem string // "" when the row is valid
	}{
		{"allowlisted licence", func(r *ImportRow) { r.Source.Licence = "CC-BY-3.0-IGO" }, ""},
		{"share-alike refused", func(r *ImportRow) { r.Source.Licence = "CC-BY-SA-4.0" }, `licence "CC-BY-SA-4.0" is not on the allowlist (ADR 0013)`},
		{"public domain with evidence", func(r *ImportRow) {
			r.Source.Licence, r.Source.LicenceURL = domain.LicencePublicDomain, "https://example.gov/rights"
		}, ""},
		{"public domain without evidence", func(r *ImportRow) { r.Source.Licence = domain.LicencePublicDomain }, "licence_url"},
		{"statute without evidence", func(r *ImportRow) { r.Source.Licence = domain.LicencePublicDomainStatute }, "licence_url"},
		{"retrieval date", func(r *ImportRow) { r.Source.RetrievedAt = "2026-10-01" }, ""},
		{"retrieval date not a date", func(r *ImportRow) { r.Source.RetrievedAt = "2026-13-01" }, "retrieved_at"},
		{"retrieval date in another format", func(r *ImportRow) { r.Source.RetrievedAt = "01/10/2026" }, "retrieved_at"},
		{"first position", func(r *ImportRow) { r.Position = &zero }, ""},
		{"negative position", func(r *ImportRow) { r.Position = &minus }, "position"},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			row := ImportRow{Line: 7, Source: ImportSource{Key: "k", Title: "t", Licence: "CC-BY-4.0"},
				Kind: domain.KindTranslate, Language: "en", Category: "public-services", Text: "The clinic opens at eight."}
			tc.edit(&row)
			store := &fakeImportStore{}

			_, err := NewImporter(store, &fakeStore{languages: launchLanguages()}).
				ImportItems(context.Background(), ImportBatch{}, []ImportRow{row})

			if tc.problem == "" {
				if err != nil || store.imported == nil {
					t.Fatalf("error = %v, want the row imported", err)
				}
				return
			}
			if !errors.Is(err, ErrInvalidInput) || !strings.Contains(err.Error(), "line 7: ") || !strings.Contains(err.Error(), tc.problem) {
				t.Fatalf("error = %v, want line 7 flagged with %q", err, tc.problem)
			}
			if store.imported != nil {
				t.Error("rows written despite errors")
			}
		})
	}
}

func TestSplitFor_IsStableAndRoughlyTenPercentTest(t *testing.T) {
	if domain.SplitFor("council-notices-2026") != domain.SplitFor("council-notices-2026") {
		t.Fatal("SplitFor is not deterministic")
	}
	test := 0
	for i := range 2000 {
		if domain.SplitFor("source-"+strconv.Itoa(i)) == domain.SplitTest {
			test++
		}
	}
	if test < 120 || test > 280 {
		t.Errorf("%d of 2000 sources went to test, want about 200", test)
	}
}
