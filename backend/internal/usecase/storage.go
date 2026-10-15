package usecase

import (
	"context"
	"errors"
	"time"
)

// ErrObjectNotFound is returned by Stat when no object has the key.
var ErrObjectNotFound = errors.New("object not found")

// ObjectInfo describes a stored object.
type ObjectInfo struct {
	Size        int64
	ContentType string
}

// StorageService is the application-layer interface for object storage.
type StorageService interface {
	PresignUpload(ctx context.Context, key string, contentType string, ttl time.Duration) (string, error)
	// Stat returns ErrObjectNotFound when nothing is stored at key, e.g. an
	// upload that never finished.
	Stat(ctx context.Context, key string) (ObjectInfo, error)
	Delete(ctx context.Context, key string) error
	PublicURL(key string) string
}
