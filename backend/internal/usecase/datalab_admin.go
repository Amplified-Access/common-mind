package usecase

import (
	"context"

	"backend/internal/domain"
)

// DataLabAdmin is what the team reads in the Data Lab admin: each
// volunteer's work, and every contribution beside the item it answers.
type DataLabAdmin interface {
	// Translators lists every volunteer, most contributions first; a
	// language narrows it and its counts to that language ("" for all).
	Translators(ctx context.Context, language string) ([]domain.Translator, error)
	// Translator returns one volunteer, or ErrNotFound.
	Translator(ctx context.Context, id int64) (*domain.Translator, error)
	// Contributions returns a page of contributions, newest first. An
	// unknown status or modality is ErrInvalidInput; the limit defaults to
	// AdminContributionsDefaultLimit and is capped at AdminContributionsMaxLimit.
	Contributions(ctx context.Context, f ContributionFilter) (*domain.AdminContributionPage, error)
}

// Page sizes for the admin's list of contributions.
const (
	AdminContributionsDefaultLimit = 50
	AdminContributionsMaxLimit     = 200
)

// DataLabAdminStore is the persistence the Data Lab admin reads.
type DataLabAdminStore interface {
	// ListTranslators returns every volunteer who joined a language or
	// contributed, most contributions first. A language narrows it to that
	// language's members and contributors, and their counts to that language;
	// an ID narrows it to one volunteer.
	ListTranslators(ctx context.Context, f TranslatorFilter) ([]domain.Translator, error)
	// ListContributions returns a page of contributions, newest first, with
	// the total matching the filter.
	ListContributions(ctx context.Context, f ContributionFilter) (*domain.AdminContributionPage, error)
}

// TranslatorFilter narrows the translators listed; zero values mean all.
type TranslatorFilter struct {
	ID       int64
	Language string
}

// ContributionFilter narrows and pages the contributions listed; zero values
// mean all.
type ContributionFilter struct {
	ContributorID int64
	Language      string
	Status        string
	Modality      string
	Limit         int
	Offset        int
}

type dataLabAdmin struct {
	store   DataLabAdminStore
	storage StorageService // nil: recordings come without a URL
}

// NewDataLabAdmin constructs the admin use case. storage may be nil.
func NewDataLabAdmin(store DataLabAdminStore, storage StorageService) DataLabAdmin {
	return &dataLabAdmin{store: store, storage: storage}
}

func (a *dataLabAdmin) Translators(ctx context.Context, language string) ([]domain.Translator, error) {
	return a.store.ListTranslators(ctx, TranslatorFilter{Language: language})
}

func (a *dataLabAdmin) Translator(ctx context.Context, id int64) (*domain.Translator, error) {
	found, err := a.store.ListTranslators(ctx, TranslatorFilter{ID: id})
	if err != nil {
		return nil, err
	}
	if len(found) == 0 {
		return nil, ErrNotFound
	}
	return &found[0], nil
}

func (a *dataLabAdmin) Contributions(ctx context.Context, f ContributionFilter) (*domain.AdminContributionPage, error) {
	switch f.Status {
	case "", domain.StatusPending, domain.StatusVerified, domain.StatusRejected:
	default:
		return nil, invalid("status must be pending, verified, or rejected")
	}
	switch f.Modality {
	case "", domain.ModalityText, domain.ModalityAudio:
	default:
		return nil, invalid("modality must be text or audio")
	}
	if f.Limit <= 0 {
		f.Limit = AdminContributionsDefaultLimit
	}
	f.Limit = min(f.Limit, AdminContributionsMaxLimit)
	f.Offset = max(f.Offset, 0)

	page, err := a.store.ListContributions(ctx, f)
	if err != nil {
		return nil, err
	}
	if a.storage != nil {
		for i, c := range page.Contributions {
			if c.AudioKey != "" {
				page.Contributions[i].AudioURL = a.storage.PublicURL(c.AudioKey)
			}
		}
	}
	return page, nil
}
