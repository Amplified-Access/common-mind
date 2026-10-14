package usecase

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain"
)

// fakeStore is a hand-written DataLabStore. Each test sets only what it needs.
type fakeStore struct {
	languages []domain.Language
	saved     *OnboardingRecord
}

func (f *fakeStore) ListLanguages(context.Context) ([]domain.Language, error) {
	return f.languages, nil
}

func (f *fakeStore) GetVolunteer(context.Context, string) (*domain.Volunteer, error) {
	return nil, nil
}

func (f *fakeStore) SaveOnboarding(_ context.Context, rec OnboardingRecord) (*domain.Volunteer, error) {
	f.saved = &rec
	return &domain.Volunteer{Name: rec.Name}, nil
}

func launchLanguages() []domain.Language {
	return []domain.Language{
		{Code: "sw", Role: domain.LanguageRoleTarget},
		{Code: "luo", Role: domain.LanguageRoleTarget},
		{Code: "en", Role: domain.LanguageRoleSource},
	}
}

func TestOnboard_ValidatesLanguagesNameAndConsent(t *testing.T) {
	tok := &FirebaseToken{UID: "uid-1", Email: "amina@example.com"}
	valid := OnboardingInput{Name: "Amina", Languages: []string{"sw", "luo", "sw"}, ConsentVersion: domain.CurrentConsentVersion}

	tests := []struct {
		name    string
		mutate  func(in *OnboardingInput)
		wantErr error
	}{
		{name: "valid, duplicates collapsed", mutate: func(*OnboardingInput) {}},
		{name: "outdated consent", mutate: func(in *OnboardingInput) { in.ConsentVersion = "2025-01-01" }, wantErr: ErrConsentOutdated},
		{name: "blank name", mutate: func(in *OnboardingInput) { in.Name = "   " }, wantErr: ErrInvalidInput},
		{name: "no languages", mutate: func(in *OnboardingInput) { in.Languages = nil }, wantErr: ErrInvalidInput},
		{name: "source language", mutate: func(in *OnboardingInput) { in.Languages = []string{"en"} }, wantErr: ErrInvalidInput},
		{name: "unknown language", mutate: func(in *OnboardingInput) { in.Languages = []string{"xx"} }, wantErr: ErrInvalidInput},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{languages: launchLanguages()}
			in := valid
			in.Languages = append([]string(nil), valid.Languages...)
			tt.mutate(&in)

			_, err := NewDataLab(store).Onboard(context.Background(), tok, in)

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Onboard() error = %v, want %v", err, tt.wantErr)
			}
			if tt.wantErr != nil {
				if store.saved != nil {
					t.Error("store written despite invalid input")
				}
				return
			}
			if got := store.saved.Languages; len(got) != 2 {
				t.Errorf("saved languages = %v, want sw and luo once each", got)
			}
		})
	}
}
