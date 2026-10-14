package usecase

import (
	"context"
	"errors"
	"strings"
	"testing"

	"backend/internal/domain"
)

// fakeStore is a hand-written DataLabStore. Each test sets only what it needs.
type fakeStore struct {
	languages   []domain.Language
	saved       *OnboardingRecord
	volunteer   *domain.Volunteer
	reviewers   int
	contributed *ContributionRecord
}

func (f *fakeStore) ListLanguages(context.Context) ([]domain.Language, error) {
	return f.languages, nil
}

func (f *fakeStore) GetVolunteer(context.Context, string) (*domain.Volunteer, error) {
	return f.volunteer, nil
}

func (f *fakeStore) CountReviewers(context.Context, string) (int, error) {
	return f.reviewers, nil
}

func (f *fakeStore) NextItem(context.Context, int64, string) (*domain.Task, error) {
	return nil, nil
}

func (f *fakeStore) CreateContribution(_ context.Context, rec ContributionRecord) (*domain.Contribution, error) {
	f.contributed = &rec
	return &domain.Contribution{ItemID: rec.ItemID}, nil
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

func swahiliContributor() *domain.Volunteer {
	return &domain.Volunteer{
		ID:             7,
		Languages:      []domain.Membership{{LanguageCode: "sw", Level: domain.LevelContributor}},
		ConsentVersion: domain.CurrentConsentVersion,
	}
}

func TestContribute_RequiresOpenLanguageMembershipAndText(t *testing.T) {
	tok := &FirebaseToken{UID: "uid-7"}
	valid := ContributionInput{ItemID: 1, Language: "sw", Text: "  Barabara imeharibika.  "}

	tests := []struct {
		name      string
		volunteer *domain.Volunteer
		reviewers int
		mutate    func(in *ContributionInput)
		wantErr   error
	}{
		{name: "valid", volunteer: swahiliContributor(), reviewers: 2},
		{name: "not onboarded", volunteer: nil, reviewers: 2, wantErr: ErrNotOnboarded},
		{name: "consent outdated", volunteer: func() *domain.Volunteer { v := swahiliContributor(); v.ConsentVersion = "old"; return v }(), reviewers: 2, wantErr: ErrConsentOutdated},
		{name: "not a member of the language", volunteer: swahiliContributor(), reviewers: 2, mutate: func(in *ContributionInput) { in.Language = "luo" }, wantErr: ErrNotMember},
		{name: "language has too few reviewers", volunteer: swahiliContributor(), reviewers: 1, wantErr: ErrLanguageClosed},
		{name: "blank text", volunteer: swahiliContributor(), reviewers: 2, mutate: func(in *ContributionInput) { in.Text = " \n " }, wantErr: ErrInvalidInput},
		{name: "text too long", volunteer: swahiliContributor(), reviewers: 2, mutate: func(in *ContributionInput) { in.Text = strings.Repeat("a", domain.MaxContributionLength+1) }, wantErr: ErrInvalidInput},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{volunteer: tt.volunteer, reviewers: tt.reviewers}
			in := valid
			if tt.mutate != nil {
				tt.mutate(&in)
			}

			_, err := NewDataLab(store).Contribute(context.Background(), tok, in)

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Contribute() error = %v, want %v", err, tt.wantErr)
			}
			if tt.wantErr != nil {
				if store.contributed != nil {
					t.Error("contribution saved despite the error")
				}
				return
			}
			rec := store.contributed
			if rec.Text != "Barabara imeharibika." || rec.ContributorID != 7 || rec.ConsentVersion != domain.CurrentConsentVersion {
				t.Errorf("saved record = %+v, want trimmed text, contributor 7, current consent", rec)
			}
		})
	}
}
