package usecase

import (
	"context"

	"backend/internal/domain"
)

// DataLabStore is the persistence the Data Lab use case depends on.
type DataLabStore interface {
	ListLanguages(ctx context.Context) ([]domain.Language, error)
}

// DataLab is the application-layer interface for the volunteer platform.
type DataLab interface {
	ListLanguages(ctx context.Context) ([]domain.Language, error)
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
