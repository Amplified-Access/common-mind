package handlers

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"

	"backend/internal/domain"
	"backend/internal/usecase"
)

const testAdminPassword = "correct horse battery"

type fakeDataLabAdmin struct {
	gotFilter usecase.ContributionFilter
	gotLevel  string
}

func (f *fakeDataLabAdmin) SetLevel(_ context.Context, id int64, language, level string) error {
	if id != 1 || language != "ugn" {
		return usecase.ErrNotFound
	}
	if level != domain.LevelReviewer {
		return fmt.Errorf("wrapped: %w", usecase.ErrInvalidInput)
	}
	f.gotLevel = level
	return nil
}

func (f *fakeDataLabAdmin) Translators(context.Context, string) ([]domain.Translator, error) {
	return []domain.Translator{}, nil
}

func (f *fakeDataLabAdmin) Translator(_ context.Context, id int64) (*domain.Translator, error) {
	if id != 1 {
		return nil, usecase.ErrNotFound
	}
	return &domain.Translator{ID: 1}, nil
}

func (f *fakeDataLabAdmin) Contributions(_ context.Context, filter usecase.ContributionFilter) (*domain.AdminContributionPage, error) {
	f.gotFilter = filter
	return &domain.AdminContributionPage{Contributions: []domain.AdminContribution{}}, nil
}

func adminGet(h *Handler, path, password string) *httptest.ResponseRecorder {
	gin.SetMode(gin.TestMode)
	req := httptest.NewRequest(http.MethodGet, path, nil)
	if password != "" {
		req.Header.Set("Authorization", "Bearer "+password)
	}
	rr := httptest.NewRecorder()
	h.RegisterRoutes(0, 0, "", []string{"http://localhost:3000"}).ServeHTTP(rr, req)
	return rr
}

func TestDataLabAdminRoutes(t *testing.T) {
	tests := []struct {
		name     string
		password string // the server's ADMIN_PASSWORD
		path     string
		sent     string // the password the request carries
		want     int
	}{
		{"translators", testAdminPassword, "/api/v1/admin/data-lab/translators?language=sw", testAdminPassword, http.StatusOK},
		{"wrong password", testAdminPassword, "/api/v1/admin/data-lab/translators", "guess", http.StatusUnauthorized},
		{"off without ADMIN_PASSWORD", "", "/api/v1/admin/data-lab/translators", testAdminPassword, http.StatusNotFound},
		{"one translator", testAdminPassword, "/api/v1/admin/data-lab/translators/1", testAdminPassword, http.StatusOK},
		{"unknown translator", testAdminPassword, "/api/v1/admin/data-lab/translators/2", testAdminPassword, http.StatusNotFound},
		{"translator ID not a number", testAdminPassword, "/api/v1/admin/data-lab/translators/amina", testAdminPassword, http.StatusBadRequest},
		{"contributions", testAdminPassword, "/api/v1/admin/data-lab/contributions", testAdminPassword, http.StatusOK},
		{"contributor not a number", testAdminPassword, "/api/v1/admin/data-lab/contributions?contributor=x", testAdminPassword, http.StatusBadRequest},
		{"limit not a number", testAdminPassword, "/api/v1/admin/data-lab/contributions?limit=all", testAdminPassword, http.StatusBadRequest},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := (&Handler{}).WithDataLabAdmin(&fakeDataLabAdmin{}, tt.password)
			if rr := adminGet(h, tt.path, tt.sent); rr.Code != tt.want {
				t.Errorf("GET %s = %d, want %d: %s", tt.path, rr.Code, tt.want, rr.Body)
			}
		})
	}
}

func TestDataLabAdminContributions_PassesTheFilterOn(t *testing.T) {
	admin := &fakeDataLabAdmin{}
	h := (&Handler{}).WithDataLabAdmin(admin, testAdminPassword)

	rr := adminGet(h, "/api/v1/admin/data-lab/contributions?contributor=4&language=sw&status=verified&modality=text&limit=20&offset=40", testAdminPassword)

	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d: %s", rr.Code, rr.Body)
	}
	want := usecase.ContributionFilter{ContributorID: 4, Language: "sw", Status: "verified", Modality: "text", Limit: 20, Offset: 40}
	if admin.gotFilter != want {
		t.Errorf("filter = %+v, want %+v", admin.gotFilter, want)
	}
}

func TestDataLabAdminSetLevel(t *testing.T) {
	tests := []struct {
		name string
		path string
		body string
		sent string
		want int
	}{
		{"make a reviewer", "/api/v1/admin/data-lab/translators/1/languages/ugn", `{"level":"reviewer"}`, testAdminPassword, http.StatusNoContent},
		{"wrong password", "/api/v1/admin/data-lab/translators/1/languages/ugn", `{"level":"reviewer"}`, "guess", http.StatusUnauthorized},
		{"no level", "/api/v1/admin/data-lab/translators/1/languages/ugn", `{}`, testAdminPassword, http.StatusBadRequest},
		{"an unknown level", "/api/v1/admin/data-lab/translators/1/languages/ugn", `{"level":"owner"}`, testAdminPassword, http.StatusBadRequest},
		{"not a member", "/api/v1/admin/data-lab/translators/1/languages/sw", `{"level":"reviewer"}`, testAdminPassword, http.StatusNotFound},
		{"ID not a number", "/api/v1/admin/data-lab/translators/amina/languages/ugn", `{"level":"reviewer"}`, testAdminPassword, http.StatusBadRequest},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			admin := &fakeDataLabAdmin{}
			h := (&Handler{}).WithDataLabAdmin(admin, testAdminPassword)
			gin.SetMode(gin.TestMode)
			req := httptest.NewRequest(http.MethodPut, tt.path, strings.NewReader(tt.body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+tt.sent)
			rr := httptest.NewRecorder()
			h.RegisterRoutes(0, 0, "", []string{"http://localhost:3000"}).ServeHTTP(rr, req)

			if rr.Code != tt.want {
				t.Fatalf("PUT %s = %d, want %d: %s", tt.path, rr.Code, tt.want, rr.Body)
			}
			if tt.want == http.StatusNoContent && admin.gotLevel != domain.LevelReviewer {
				t.Errorf("level passed on = %q, want reviewer", admin.gotLevel)
			}
		})
	}
}
