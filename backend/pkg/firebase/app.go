package firebase

import (
	"context"
	"fmt"
	"log/slog"

	firebasesdk "firebase.google.com/go/v4"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/option"
)

// NewApp initialises the Firebase Admin SDK default app.
// credentialsJSON is the raw service account JSON (FIREBASE_SERVICE_ACCOUNT_JSON).
// When empty the SDK uses Application Default Credentials (ADC) if the host
// has them (GCP). Elsewhere — local machines, Railway — it starts without
// credentials: verifying ID tokens only needs Google's public keys, so
// sign-in works, while admin calls such as user lookups fail until a service
// account is configured.
func NewApp(ctx context.Context, projectID, credentialsJSON string) (*firebasesdk.App, error) {
	var opts []option.ClientOption
	switch {
	case credentialsJSON != "":
		opts = append(opts, option.WithCredentialsJSON([]byte(credentialsJSON)))
	case !hasDefaultCredentials(ctx):
		slog.Warn("firebase: no service account or default credentials; ID token verification only", "project_id", projectID)
		opts = append(opts, option.WithoutAuthentication())
	}
	cfg := &firebasesdk.Config{ProjectID: projectID}
	app, err := firebasesdk.NewApp(ctx, cfg, opts...)
	if err != nil {
		return nil, fmt.Errorf("firebase: init app: %w", err)
	}
	return app, nil
}

func hasDefaultCredentials(ctx context.Context) bool {
	_, err := google.FindDefaultCredentials(ctx)
	return err == nil
}
