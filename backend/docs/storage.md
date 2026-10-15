---
topic: storage
last_verified: 2026-10-15
sources:
  - backend/internal/usecase/storage.go
  - backend/internal/infrastructure/storage/r2/storage.go
  - backend/internal/bootstrap/bootstrap.go
---

# Storage (Cloudflare R2)

## Overview
R2 is the optional object storage backend. The integration is enabled only when `R2_ACCOUNT_ID` is set in the environment. When absent, `App.StorageService` is `nil` and features that store files are off.

## Interface
`usecase.StorageService` is defined in `internal/usecase/storage.go` and sits at the use-case layer to keep the transport and infrastructure layers decoupled from any concrete SDK:

```go
type StorageService interface {
    PresignUpload(ctx context.Context, key string, contentType string, ttl time.Duration) (string, error)
    // Stat returns ErrObjectNotFound when nothing is stored at key.
    Stat(ctx context.Context, key string) (ObjectInfo, error) // ObjectInfo{Size, ContentType}
    Delete(ctx context.Context, key string) error
    PublicURL(key string) string
}
```

## R2 implementation
Package `internal/infrastructure/storage/r2` provides the concrete implementation using the AWS SDK v2 (R2 is S3-compatible).

### Constructors

```go
// Production — uses default AWS SDK HTTP client.
func New(accountID, accessKey, secretKey, bucket, publicBaseURL string) (usecase.StorageService, error)

// Test-friendly — accepts a custom *http.Client to inject a mock transport.
// Pass nil to behave identically to New.
func NewWithHTTPClient(accountID, accessKey, secretKey, bucket, publicBaseURL string, httpClient *http.Client) (usecase.StorageService, error)
```

Both constructors return an error if any argument is empty. The R2 endpoint is derived as:
```
https://<accountID>.r2.cloudflarestorage.com
```
The S3 client is configured with `UsePathStyle: true` and region `"auto"`.

### Method behaviour
- `PresignUpload` calls `s3.PresignClient.PresignPutObject` and returns the signed URL. TTL is caller-controlled.
- `Stat` sends a `HeadObject` and returns the object's size and content type; a 404 becomes `usecase.ErrObjectNotFound`. Use it to confirm a browser upload landed (and how big it is) before recording it.
- `Delete` calls `s3.Client.DeleteObject` directly (no presigning).
- `PublicURL` returns `publicBaseURL + "/" + url.PathEscape(key)`.

## HTTP endpoints

None of its own. The service is used by features that decide what may be stored and under which key, so a client can never choose an arbitrary key. The template's open `POST /storage/presign` and `DELETE /storage/:key` routes were removed for that reason: any signed-in user could overwrite or delete any object, including volunteers' recordings.

## Bootstrap wiring
In `bootstrap.Run`:
```go
var storageService usecase.StorageService
if cfg.R2AccountID != "" {
    svc, err := r2.New(cfg.R2AccountID, cfg.R2AccessKey, cfg.R2SecretKey, cfg.R2Bucket, cfg.R2PublicURL)
    if err != nil {
        return nil, fmt.Errorf("bootstrap: r2: %w", err)
    }
    storageService = svc
    log.Info("bootstrap: R2 storage client initialised", "bucket", cfg.R2Bucket)
}
```
No `validateConfig` checks guard the R2 block — if `R2_ACCOUNT_ID` is non-empty but other R2 vars are empty, `r2.New` returns an error that aborts startup.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `R2_ACCOUNT_ID` | Conditional — presence enables the feature | Cloudflare account ID. Found in the R2 dashboard overview. |
| `R2_ACCESS_KEY` | Required when `R2_ACCOUNT_ID` is set | R2 API token access key. |
| `R2_SECRET_KEY` | Required when `R2_ACCOUNT_ID` is set | R2 API token secret key. |
| `R2_BUCKET` | Required when `R2_ACCOUNT_ID` is set | Name of the R2 bucket. |
| `R2_PUBLIC_URL` | Required when `R2_ACCOUNT_ID` is set | Public base URL for the bucket (custom domain or `r2.dev` subdomain). |

## Testing

### r2 package tests
Tests in `internal/infrastructure/storage/r2/` use `NewWithHTTPClient` with a custom `http.RoundTripper` to intercept S3 and presign requests without making real network calls:

```go
transport := &mockTransport{handler: func(r *http.Request) *http.Response { ... }}
svc, _ := r2.NewWithHTTPClient("acct", "key", "secret", "bucket", "https://pub.example.com",
    &http.Client{Transport: transport})
```
