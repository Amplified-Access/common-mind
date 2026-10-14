package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"backend/internal/usecase"
)

func TestDataLabError_MapsUseCaseErrors(t *testing.T) {
	gin.SetMode(gin.TestMode)
	tests := []struct {
		err     error
		status  int
		code    string
		passMsg bool // the use case's message is shown to the volunteer
	}{
		{err: usecase.ErrNotOnboarded, status: http.StatusForbidden, code: "onboarding_required"},
		{err: usecase.ErrConsentOutdated, status: http.StatusForbidden, code: "consent_required"},
		{err: fmt.Errorf("wrapped: %w", usecase.ErrInvalidInput), status: http.StatusBadRequest, code: "invalid_input", passMsg: true},
		{err: errors.New("db down"), status: http.StatusInternalServerError, code: "internal_error"},
	}
	for _, tt := range tests {
		t.Run(tt.code, func(t *testing.T) {
			w := httptest.NewRecorder()
			c, _ := gin.CreateTestContext(w)

			dataLabError(c, tt.err)

			if w.Code != tt.status {
				t.Errorf("status = %d, want %d", w.Code, tt.status)
			}
			var body errBody
			if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
				t.Fatal(err)
			}
			if body.Error.Code != tt.code {
				t.Errorf("code = %q, want %q", body.Error.Code, tt.code)
			}
			if tt.passMsg && body.Error.Message != tt.err.Error() {
				t.Errorf("message = %q, want %q", body.Error.Message, tt.err.Error())
			}
			if tt.status == http.StatusInternalServerError && body.Error.Message == tt.err.Error() {
				t.Error("internal error detail leaked to the client")
			}
		})
	}
}
