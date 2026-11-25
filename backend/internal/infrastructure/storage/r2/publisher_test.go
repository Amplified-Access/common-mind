package r2_test

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"backend/internal/infrastructure/storage/r2"
)

func TestPublish_UploadsOnceWithItsTypeAndAnImmutableCache(t *testing.T) {
	body := []byte("(module)")
	sum := sha256.Sum256(body)
	hash := hex.EncodeToString(sum[:])

	tests := []struct {
		name       string
		existing   string // the stored copy's sha256 metadata; "" when missing
		wantUpload bool
	}{
		{name: "not there yet", existing: "", wantUpload: true},
		{name: "there, but a different file", existing: "0123", wantUpload: true},
		{name: "already there", existing: hash, wantUpload: false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var put *http.Request
			var putBody []byte
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				switch r.Method {
				case http.MethodHead:
					if tt.existing == "" {
						w.WriteHeader(http.StatusNotFound)
						return
					}
					w.Header().Set("x-amz-meta-sha256", tt.existing)
					w.WriteHeader(http.StatusOK)
				case http.MethodPut:
					put = r
					putBody, _ = io.ReadAll(r.Body)
					w.WriteHeader(http.StatusOK)
				}
			}))
			defer srv.Close()
			httpClient := &http.Client{Transport: roundTripFunc(func(req *http.Request) (*http.Response, error) {
				req.URL.Host = strings.TrimPrefix(srv.URL, "http://")
				req.URL.Scheme = "http"
				return http.DefaultTransport.RoundTrip(req)
			})}
			pub, err := r2.NewPublisherWithHTTPClient("acct123", "AKID", "SECRET", "my-bucket", httpClient)
			if err != nil {
				t.Fatalf("NewPublisherWithHTTPClient: %v", err)
			}

			uploaded, err := pub.Publish(context.Background(), "mediapipe/x/vision.wasm", "application/wasm", body)
			if err != nil {
				t.Fatalf("Publish: %v", err)
			}

			if uploaded != tt.wantUpload || (put != nil) != tt.wantUpload {
				t.Fatalf("uploaded = %v (PUT sent: %v), want %v", uploaded, put != nil, tt.wantUpload)
			}
			if !tt.wantUpload {
				return
			}
			if got := put.Header.Get("Content-Type"); got != "application/wasm" {
				t.Errorf("Content-Type = %q, want application/wasm", got)
			}
			if got := put.Header.Get("Cache-Control"); got != "public, max-age=31536000, immutable" {
				t.Errorf("Cache-Control = %q, want a year, immutable", got)
			}
			if got := put.Header.Get("x-amz-meta-sha256"); got != hash {
				t.Errorf("sha256 metadata = %q, want %q", got, hash)
			}
			if !strings.Contains(string(putBody), "(module)") {
				t.Errorf("body = %q, want the file", putBody)
			}
		})
	}
}
