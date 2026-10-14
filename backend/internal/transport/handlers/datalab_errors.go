package handlers

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/transport/middleware"
	"backend/internal/usecase"
)

// dataLabError writes the response for a Data Lab use-case error. Codes are
// stable so the web app can branch on them; unknown errors are logged and
// hidden behind internal_error.
func dataLabError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, usecase.ErrNotOnboarded):
		JSONError(c, http.StatusForbidden, "onboarding_required", "complete onboarding first")
	case errors.Is(err, usecase.ErrConsentOutdated):
		JSONError(c, http.StatusForbidden, "consent_required", "accept the current consent first")
	case errors.Is(err, usecase.ErrInvalidInput):
		JSONError(c, http.StatusBadRequest, "invalid_input", err.Error())
	default:
		slog.Error("data lab request failed", "path", c.FullPath(), "error", err)
		JSONError(c, http.StatusInternalServerError, "internal_error", "something went wrong")
	}
}

// currentToken returns the verified Firebase claims set by the auth middleware.
func currentToken(c *gin.Context) (*usecase.FirebaseToken, bool) {
	raw, _ := c.Get(middleware.FirebaseClaimsKey)
	tok, ok := raw.(*usecase.FirebaseToken)
	if !ok {
		JSONError(c, http.StatusUnauthorized, "unauthorized", "missing or invalid token")
	}
	return tok, ok
}
