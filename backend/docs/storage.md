---
topic: storage
last_verified: 2026-11-25
sources:
  - backend/internal/usecase/storage.go
  - backend/internal/infrastructure/storage/r2/storage.go
  - backend/internal/infrastructure/storage/r2/publisher.go
  - backend/cmd/assets/main.go
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

## Bucket setup for browser uploads

Features upload straight from the browser to a presigned URL, so the bucket needs a CORS policy. In the Cloudflare dashboard → R2 → the bucket → Settings → CORS policy:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://thecommonmind.org", "https://www.thecommonmind.org"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

The Data Lab's recordings are served from the bucket's public URL (`R2_PUBLIC_URL`): connect a custom domain under Settings → Custom Domains (the sister projects use `cdn.<domain>`, e.g. `cdn.thecommonmind.org`), or enable the `r2.dev` subdomain for testing.

The bucket is `common-mind`, in the Amplified Access Cloudflare account.

## Published static assets

Besides recordings, the bucket serves static files the web app loads, under versioned keys, so each key's content never changes. `r2.Publisher` (`publisher.go`) uploads them for admin commands: with their content type, `Cache-Control: public, max-age=31536000, immutable`, and a `sha256` metadata entry; a file already there with the same hash is skipped.

The Data Lab's hand tracker (ADR 0014) is published this way, so volunteers' browsers load it from `R2_PUBLIC_URL` and never from a third party:

```bash
make publish-mediapipe   # from backend/, after installing web/node_modules
```

| Key | What |
|---|---|
| `mediapipe/tasks-vision/<version>/wasm/vision_wasm_internal.{js,wasm}` | The MediaPipe runtime, copied from `web/node_modules/@mediapipe/tasks-vision` at the version `web/package.json` pins |
| `mediapipe/models/holistic_landmarker/float16/1/holistic_landmarker.task` | The holistic model, downloaded from Google and checked against the SHA-256 in `cmd/assets/main.go`; a different file is refused |

When `@mediapipe/tasks-vision` is upgraded, run the command again and update `MEDIAPIPE_VERSION` in `web/components/data-lab/sign-recorder.tsx`. The browser fetches these files cross-origin, so the bucket's CORS policy (above) must allow `GET` from the web app's origins, as it does.

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
