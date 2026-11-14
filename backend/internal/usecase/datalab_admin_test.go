package usecase

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain"
)

type fakeAdminStore struct {
	translators   []domain.Translator
	contributions []domain.AdminContribution
	gotFilter     ContributionFilter
	gotTranslator TranslatorFilter
}

func (s *fakeAdminStore) ListTranslators(_ context.Context, f TranslatorFilter) ([]domain.Translator, error) {
	s.gotTranslator = f
	return s.translators, nil
}

func (s *fakeAdminStore) ListContributions(_ context.Context, f ContributionFilter) (*domain.AdminContributionPage, error) {
	s.gotFilter = f
	return &domain.AdminContributionPage{Total: len(s.contributions), Contributions: s.contributions}, nil
}

func TestDataLabAdmin_Contributions_PagesWithinLimits(t *testing.T) {
	tests := []struct {
		name           string
		limit, offset  int
		wantL, wantOff int
	}{
		{"no limit takes the default", 0, 0, AdminContributionsDefaultLimit, 0},
		{"a limit within range is kept", 20, 40, 20, 40},
		{"too large a limit is capped", 5000, 0, AdminContributionsMaxLimit, 0},
		{"a negative offset starts at the top", 10, -5, 10, 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeAdminStore{}
			_, err := NewDataLabAdmin(store, nil).Contributions(context.Background(), ContributionFilter{Limit: tt.limit, Offset: tt.offset})
			if err != nil {
				t.Fatalf("Contributions: %v", err)
			}
			if store.gotFilter.Limit != tt.wantL || store.gotFilter.Offset != tt.wantOff {
				t.Errorf("limit, offset = %d, %d, want %d, %d", store.gotFilter.Limit, store.gotFilter.Offset, tt.wantL, tt.wantOff)
			}
		})
	}
}

func TestDataLabAdmin_Contributions_RefusesUnknownStatusOrModality(t *testing.T) {
	for _, f := range []ContributionFilter{{Status: "approved"}, {Modality: "video"}} {
		_, err := NewDataLabAdmin(&fakeAdminStore{}, nil).Contributions(context.Background(), f)
		if !errors.Is(err, ErrInvalidInput) {
			t.Errorf("Contributions(%+v) error = %v, want ErrInvalidInput", f, err)
		}
	}
}

func TestDataLabAdmin_Contributions_GivesRecordingsTheirURL(t *testing.T) {
	store := &fakeAdminStore{contributions: []domain.AdminContribution{
		{ID: 1, Modality: domain.ModalityText},
		{ID: 2, Modality: domain.ModalityAudio, AudioKey: "data-lab/voice/sw/1/a.webm"},
	}}

	page, err := NewDataLabAdmin(store, &fakeStorage{}).Contributions(context.Background(), ContributionFilter{})
	if err != nil {
		t.Fatalf("Contributions: %v", err)
	}
	if page.Contributions[0].AudioURL != "" {
		t.Errorf("written contribution got an audio URL %q", page.Contributions[0].AudioURL)
	}
	if got := page.Contributions[1].AudioURL; got != "https://audio.example/data-lab/voice/sw/1/a.webm" {
		t.Errorf("recording URL = %q", got)
	}
}

func TestDataLabAdmin_Translator_NotFoundWhenNone(t *testing.T) {
	_, err := NewDataLabAdmin(&fakeAdminStore{}, nil).Translator(context.Background(), 7)
	if !errors.Is(err, ErrNotFound) {
		t.Errorf("Translator(unknown) error = %v, want ErrNotFound", err)
	}
}
