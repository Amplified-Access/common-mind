// Command assets publishes static files the web app loads from object
// storage, at R2_PUBLIC_URL, under versioned keys. It reads the R2 settings
// from .env.
//
//	assets mediapipe   the hand tracker's runtime and model (ADR 0014)
//
// Run it from backend/ (make publish-mediapipe) after installing the web
// app's packages: the runtime comes from web/node_modules, at the version
// web/package.json pins. Files already published unchanged are skipped.
package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/joho/godotenv/autoload"

	"backend/internal/infrastructure/storage/r2"
)

const usage = "usage: assets mediapipe"

// The holistic model, as Google publishes it. The hash is the file's at
// publication; a download that differs is refused, never published.
const (
	modelURL    = "https://storage.googleapis.com/mediapipe-models/holistic_landmarker/holistic_landmarker/float16/1/holistic_landmarker.task"
	modelKey    = "mediapipe/models/holistic_landmarker/float16/1/holistic_landmarker.task"
	modelSHA256 = "e2dab61191e2dcd0a15f943d8e3ed1dce13c82dfa597b9dd39f562975a50c3f8"
)

// The runtime files the web app loads: the non-module build that
// FilesetResolver.forVisionTasks picks by default.
var runtimeFiles = map[string]string{
	"vision_wasm_internal.js":   "text/javascript",
	"vision_wasm_internal.wasm": "application/wasm",
}

const webPackage = "../web/node_modules/@mediapipe/tasks-vision"

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) != 1 || args[0] != "mediapipe" {
		return fmt.Errorf("%s", usage)
	}
	pub, err := r2.NewPublisher(os.Getenv("R2_ACCOUNT_ID"), os.Getenv("R2_ACCESS_KEY"), os.Getenv("R2_SECRET_KEY"), os.Getenv("R2_BUCKET"))
	if err != nil {
		return err
	}
	ctx := context.Background()

	version, err := runtimeVersion()
	if err != nil {
		return err
	}
	for name, contentType := range runtimeFiles {
		body, err := os.ReadFile(filepath.Join(webPackage, "wasm", name))
		if err != nil {
			return fmt.Errorf("read the runtime (install the web app's packages first): %w", err)
		}
		if err := publish(ctx, pub, fmt.Sprintf("mediapipe/tasks-vision/%s/wasm/%s", version, name), contentType, body); err != nil {
			return err
		}
	}

	model, err := download(ctx, modelURL)
	if err != nil {
		return err
	}
	sum := sha256.Sum256(model)
	if got := hex.EncodeToString(sum[:]); got != modelSHA256 {
		return fmt.Errorf("the model's sha256 is %s, not the %s published: refusing to publish it", got, modelSHA256)
	}
	if err := publish(ctx, pub, modelKey, "application/octet-stream", model); err != nil {
		return err
	}

	fmt.Printf("served from %s/mediapipe/\n", strings.TrimRight(os.Getenv("R2_PUBLIC_URL"), "/"))
	return nil
}

func publish(ctx context.Context, pub *r2.Publisher, key, contentType string, body []byte) error {
	uploaded, err := pub.Publish(ctx, key, contentType, body)
	if err != nil {
		return err
	}
	state := "already there"
	if uploaded {
		state = "uploaded"
	}
	fmt.Printf("%-13s %s (%.1f MB)\n", state, key, float64(len(body))/(1<<20))
	return nil
}

// runtimeVersion is the installed @mediapipe/tasks-vision version.
func runtimeVersion() (string, error) {
	raw, err := os.ReadFile(filepath.Join(webPackage, "package.json"))
	if err != nil {
		return "", fmt.Errorf("read the runtime's version (install the web app's packages first): %w", err)
	}
	var pkg struct {
		Version string `json:"version"`
	}
	if err := json.Unmarshal(raw, &pkg); err != nil || pkg.Version == "" {
		return "", fmt.Errorf("read the runtime's version: %v", err)
	}
	return pkg.Version, nil
}

func download(ctx context.Context, url string) ([]byte, error) {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("download the model: %w", err)
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download the model: %s", res.Status)
	}
	return io.ReadAll(res.Body)
}
