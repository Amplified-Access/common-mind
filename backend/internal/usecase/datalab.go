package usecase

import (
	"context"
	"strings"

	"backend/internal/domain"
)

// DataLabStore is the persistence the Data Lab use case depends on.
type DataLabStore interface {
	ListLanguages(ctx context.Context) ([]domain.Language, error)
	// GetVolunteer returns nil, nil when the Firebase user has not onboarded.
	GetVolunteer(ctx context.Context, firebaseUID string) (*domain.Volunteer, error)
	// SaveOnboarding upserts the user, adds memberships without lowering an
	// existing level, and records consent, in one transaction.
	SaveOnboarding(ctx context.Context, rec OnboardingRecord) (*domain.Volunteer, error)
}

// DataLab is the application-layer interface for the volunteer platform.
type DataLab interface {
	ListLanguages(ctx context.Context) ([]domain.Language, error)
	// Me returns ErrNotOnboarded when the user has no Data Lab profile yet.
	Me(ctx context.Context, tok *FirebaseToken) (*domain.Volunteer, error)
	Onboard(ctx context.Context, tok *FirebaseToken, in OnboardingInput) (*domain.Volunteer, error)
}

// OnboardingInput is what a volunteer submits when joining or adding languages.
type OnboardingInput struct {
	Name           string
	Languages      []string
	ConsentVersion string
}

// OnboardingRecord is a validated onboarding, ready to persist.
type OnboardingRecord struct {
	FirebaseUID    string
	Name           string
	Email          string
	PhotoURL       string
	Languages      []string
	ConsentVersion string
}

type dataLab struct {
	store DataLabStore
}

// NewDataLab constructs the Data Lab use case.
func NewDataLab(store DataLabStore) DataLab {
	return &dataLab{store: store}
}

func (d *dataLab) ListLanguages(ctx context.Context) ([]domain.Language, error) {
	return d.store.ListLanguages(ctx)
}

func (d *dataLab) Me(ctx context.Context, tok *FirebaseToken) (*domain.Volunteer, error) {
	v, err := d.store.GetVolunteer(ctx, tok.UID)
	if err != nil {
		return nil, err
	}
	if v == nil {
		return nil, ErrNotOnboarded
	}
	return v, nil
}

func (d *dataLab) Onboard(ctx context.Context, tok *FirebaseToken, in OnboardingInput) (*domain.Volunteer, error) {
	if in.ConsentVersion != domain.CurrentConsentVersion {
		return nil, ErrConsentOutdated
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, invalid("name is required")
	}

	langs, err := d.store.ListLanguages(ctx)
	if err != nil {
		return nil, err
	}
	targets := make(map[string]bool, len(langs))
	for _, l := range langs {
		targets[l.Code] = l.Role == domain.LanguageRoleTarget
	}

	var codes []string
	seen := make(map[string]bool)
	for _, code := range in.Languages {
		if seen[code] {
			continue
		}
		if !targets[code] {
			return nil, invalid("unknown language: " + code)
		}
		seen[code] = true
		codes = append(codes, code)
	}
	if len(codes) == 0 {
		return nil, invalid("choose at least one language")
	}

	return d.store.SaveOnboarding(ctx, OnboardingRecord{
		FirebaseUID:    tok.UID,
		Name:           name,
		Email:          tok.Email,
		PhotoURL:       tok.PhotoURL,
		Languages:      codes,
		ConsentVersion: in.ConsentVersion,
	})
}
