package r2

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	smithyhttp "github.com/aws/smithy-go/transport/http"
)

// immutable is the cache header for published assets: their keys carry a
// version, so a key's content never changes and browsers keep it a year.
const immutable = "public, max-age=31536000, immutable"

// Publisher uploads versioned static assets the web app loads from the
// bucket's public URL, such as the hand tracker's runtime and model (ADR
// 0014). It is for admin commands, never request handling.
type Publisher struct {
	client *s3.Client
	bucket string
}

// NewPublisher returns a Publisher for the bucket.
func NewPublisher(accountID, accessKey, secretKey, bucket string) (*Publisher, error) {
	return NewPublisherWithHTTPClient(accountID, accessKey, secretKey, bucket, nil)
}

// NewPublisherWithHTTPClient is like NewPublisher with a custom HTTP client,
// for tests; nil uses the SDK's.
func NewPublisherWithHTTPClient(accountID, accessKey, secretKey, bucket string, httpClient *http.Client) (*Publisher, error) {
	if accountID == "" || accessKey == "" || secretKey == "" || bucket == "" {
		return nil, errors.New("r2: accountID, accessKey, secretKey, and bucket are all required")
	}
	client, err := newClient(accountID, accessKey, secretKey, httpClient)
	if err != nil {
		return nil, err
	}
	return &Publisher{client: client, bucket: bucket}, nil
}

// Publish uploads body to key with its content type, cached as immutable,
// unless the bucket already holds the same file there (by the sha256 stored
// with it). It reports whether it uploaded.
func (p *Publisher) Publish(ctx context.Context, key, contentType string, body []byte) (bool, error) {
	sum := sha256.Sum256(body)
	hash := hex.EncodeToString(sum[:])

	head, err := p.client.HeadObject(ctx, &s3.HeadObjectInput{Bucket: aws.String(p.bucket), Key: aws.String(key)})
	var resp *smithyhttp.ResponseError
	switch {
	case err == nil:
		if head.Metadata["sha256"] == hash {
			return false, nil
		}
	case errors.As(err, &resp) && resp.HTTPStatusCode() == http.StatusNotFound:
	default:
		return false, fmt.Errorf("r2: check %s: %w", key, err)
	}

	if _, err := p.client.PutObject(ctx, &s3.PutObjectInput{
		Bucket:        aws.String(p.bucket),
		Key:           aws.String(key),
		Body:          bytes.NewReader(body),
		ContentLength: aws.Int64(int64(len(body))),
		ContentType:   aws.String(contentType),
		CacheControl:  aws.String(immutable),
		Metadata:      map[string]string{"sha256": hash},
	}); err != nil {
		return false, fmt.Errorf("r2: upload %s: %w", key, err)
	}
	return true, nil
}
