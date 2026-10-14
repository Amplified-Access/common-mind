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
	case errors.Is(err, usecase.ErrNotMember):
		JSONError(c, http.StatusForbidden, "not_member", "add this language to your profile first")
	case errors.Is(err, usecase.ErrLanguageClosed):
		JSONError(c, http.StatusConflict, "language_closed", "this language opens once it has reviewers")
	case errors.Is(err, usecase.ErrNoTasks):
		JSONError(c, http.StatusNotFound, "no_tasks", "nothing left to do in this language right now")
	case errors.Is(err, usecase.ErrNotFound):
		JSONError(c, http.StatusNotFound, "not_found", "not found")
	case errors.Is(err, usecase.ErrAlreadyContributed):
		JSONError(c, http.StatusConflict, "already_contributed", "you already submitted this one")
	case errors.Is(err, usecase.ErrNotReviewer):
		JSONError(c, http.StatusForbidden, "not_reviewer", "reviewing needs reviewer access in this language")
	case errors.Is(err, usecase.ErrOwnContribution):
		JSONError(c, http.StatusForbidden, "own_contribution", "someone else has to review your work")
	case errors.Is(err, usecase.ErrAlreadyReviewed):
		JSONError(c, http.StatusConflict, "already_reviewed", "this one has already been reviewed")
	case errors.Is(err, usecase.ErrNoReviews):
		JSONError(c, http.StatusNotFound, "no_reviews", "nothing waiting for review in this language")
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
