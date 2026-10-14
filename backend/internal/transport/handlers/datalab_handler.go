package handlers

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/usecase"
)

// ListLanguagesHandler godoc
//
//	@Summary		List Data Lab languages
//	@Description	Returns the enabled languages: the target languages volunteers contribute in, then the source languages.
//	@Tags			data-lab
//	@Produce		json
//	@Success		200	{array}		LanguageAlias
//	@Failure		500	{object}	map[string]string
//	@Router			/api/v1/data-lab/languages [get]
func (h *Handler) ListLanguagesHandler(c *gin.Context) {
	langs, err := h.dataLab.ListLanguages(c.Request.Context())
	if err != nil {
		slog.Error("data lab: list languages", "error", err)
		JSONError(c, http.StatusInternalServerError, "internal_error", "failed to list languages")
		return
	}
	JSON(c, langs)
}

// DataLabMeHandler godoc
//
//	@Summary		Get my Data Lab profile
//	@Description	Returns the volunteer's languages, levels, and consent. 403 onboarding_required when they have not joined yet.
//	@Tags			data-lab
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	VolunteerAlias
//	@Failure		401	{object}	map[string]string
//	@Failure		403	{object}	map[string]string
//	@Router			/api/v1/data-lab/me [get]
func (h *Handler) DataLabMeHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	v, err := h.dataLab.Me(c.Request.Context(), tok)
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, v)
}

type onboardingRequest struct {
	Name           string   `json:"name"`
	Languages      []string `json:"languages"`
	ConsentVersion string   `json:"consent_version"`
}

// OnboardHandler godoc
//
//	@Summary		Join the Data Lab or add languages
//	@Description	Records the volunteer's name, languages, and acceptance of the current consent. Calling it again adds languages and never lowers a level.
//	@Tags			data-lab
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		onboardingRequest	true	"Onboarding"
//	@Success		200		{object}	VolunteerAlias
//	@Failure		400		{object}	map[string]string
//	@Failure		401		{object}	map[string]string
//	@Failure		403		{object}	map[string]string	"consent_required"
//	@Router			/api/v1/data-lab/onboarding [post]
func (h *Handler) OnboardHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var req onboardingRequest
	if !bindJSON(c, &req) {
		return
	}
	v, err := h.dataLab.Onboard(c.Request.Context(), tok, usecase.OnboardingInput{
		Name:           req.Name,
		Languages:      req.Languages,
		ConsentVersion: req.ConsentVersion,
	})
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, v)
}
