package usecase

import (
	"context"
	"strings"
	"unicode/utf8"

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
	// CountReviewers counts reviewers and leads in a language.
	CountReviewers(ctx context.Context, language string) (int, error)
	// NextItem returns an item the volunteer hasn't done that has no pending or
	// verified contribution in the language, or nil, nil when none is left.
	NextItem(ctx context.Context, userID int64, language string) (*domain.Task, error)
	// CreateContribution returns ErrNotFound for an unknown item and
	// ErrAlreadyContributed for a repeat by the same volunteer.
	CreateContribution(ctx context.Context, rec ContributionRecord) (*domain.Contribution, error)
}

// DataLab is the application-layer interface for the volunteer platform.
type DataLab interface {
	ListLanguages(ctx context.Context) ([]domain.Language, error)
	// Me returns ErrNotOnboarded when the user has no Data Lab profile yet.
	Me(ctx context.Context, tok *FirebaseToken) (*domain.Volunteer, error)
	Onboard(ctx context.Context, tok *FirebaseToken, in OnboardingInput) (*domain.Volunteer, error)
	// NextTask returns ErrNoTasks when the language has nothing left for the volunteer.
	NextTask(ctx context.Context, tok *FirebaseToken, language string) (*domain.Task, error)
	Contribute(ctx context.Context, tok *FirebaseToken, in ContributionInput) (*domain.Contribution, error)
}

// ContributionInput is a volunteer's submission for one item.
type ContributionInput struct {
	ItemID   int64
	Language string
	Text     string
	Pasted   bool
}

// ContributionRecord is a validated contribution, ready to persist.
type ContributionRecord struct {
	ItemID         int64
	Language       string
	ContributorID  int64
	Text           string
	Pasted         bool
	ConsentVersion string
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

// contributorIn loads the volunteer and checks they may contribute in the
// language: onboarded, current consent, a member, and the language open.
func (d *dataLab) contributorIn(ctx context.Context, tok *FirebaseToken, language string) (*domain.Volunteer, error) {
	v, err := d.Me(ctx, tok)
	if err != nil {
		return nil, err
	}
	if !v.ConsentCurrent() {
		return nil, ErrConsentOutdated
	}
	if _, ok := v.Membership(language); !ok {
		return nil, ErrNotMember
	}
	reviewers, err := d.store.CountReviewers(ctx, language)
	if err != nil {
		return nil, err
	}
	if reviewers < domain.MinReviewersToOpen {
		return nil, ErrLanguageClosed
	}
	return v, nil
}

func (d *dataLab) NextTask(ctx context.Context, tok *FirebaseToken, language string) (*domain.Task, error) {
	v, err := d.contributorIn(ctx, tok, language)
	if err != nil {
		return nil, err
	}
	task, err := d.store.NextItem(ctx, v.ID, language)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, ErrNoTasks
	}
	return task, nil
}

func (d *dataLab) Contribute(ctx context.Context, tok *FirebaseToken, in ContributionInput) (*domain.Contribution, error) {
	v, err := d.contributorIn(ctx, tok, in.Language)
	if err != nil {
		return nil, err
	}
	text := strings.TrimSpace(in.Text)
	if text == "" {
		return nil, invalid("write something before submitting")
	}
	if utf8.RuneCountInString(text) > domain.MaxContributionLength {
		return nil, invalid("keep it under 2,000 characters")
	}
	return d.store.CreateContribution(ctx, ContributionRecord{
		ItemID:         in.ItemID,
		Language:       in.Language,
		ContributorID:  v.ID,
		Text:           text,
		Pasted:         in.Pasted,
		ConsentVersion: v.ConsentVersion,
	})
}
