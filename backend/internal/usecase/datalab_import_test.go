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

func (f *fakeImportStore) ImportItems(_ context.Context, rows []ImportRow) (ImportResult, error) {
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
	}
	store := &fakeImportStore{}
	langs := &fakeStore{languages: launchLanguages()}

	_, err := NewImporter(store, langs).ImportItems(context.Background(), rows)

	if !errors.Is(err, ErrInvalidInput) {
		t.Fatalf("error = %v, want ErrInvalidInput", err)
	}
	for _, line := range []string{"line 2", "line 3", "line 4", "line 5", "line 6"} {
		if !strings.Contains(err.Error(), line) {
			t.Errorf("error %q does not mention %s", err, line)
		}
	}
	if strings.Contains(err.Error(), "line 1:") {
		t.Errorf("error %q flags the valid line 1", err)
	}
	if store.imported != nil {
		t.Error("rows written despite errors")
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
