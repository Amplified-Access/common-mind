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

// ProgressHandler godoc
//
//	@Summary		Live progress per language
//	@Description	Verified and pending counts, members, reviewers, and whether each target language is open. Signed-in clients also receive data-lab.progress messages on /ws as counts change.
//	@Tags			data-lab
//	@Produce		json
//	@Success		200	{array}		LanguageProgressAlias
//	@Failure		500	{object}	map[string]string
//	@Router			/api/v1/data-lab/progress [get]
func (h *Handler) ProgressHandler(c *gin.Context) {
	progress, err := h.dataLab.Progress(c.Request.Context())
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, progress)
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

type languageQuery struct {
	Language string `form:"language" binding:"required"`
}

// NextTaskHandler godoc
//
//	@Summary		Get the next task in a language
//	@Description	Returns an item to translate or a prompt to answer. 404 no_tasks when the language has nothing left for this volunteer; 409 language_closed until it has two reviewers.
//	@Tags			data-lab
//	@Produce		json
//	@Security		BearerAuth
//	@Param			language	query		string	true	"Target language code, e.g. sw"
//	@Success		200			{object}	TaskAlias
//	@Failure		403			{object}	map[string]string
//	@Failure		404			{object}	map[string]string	"no_tasks"
//	@Failure		409			{object}	map[string]string	"language_closed"
//	@Router			/api/v1/data-lab/tasks/next [get]
func (h *Handler) NextTaskHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var q languageQuery
	if !bindQuery(c, &q) {
		return
	}
	task, err := h.dataLab.NextTask(c.Request.Context(), tok, q.Language)
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, task)
}

type contributionRequest struct {
	ItemID   int64  `json:"item_id" binding:"required"`
	Language string `json:"language" binding:"required"`
	Text     string `json:"text"`
	Pasted   bool   `json:"pasted"`
}

// ContributeHandler godoc
//
//	@Summary		Submit a contribution
//	@Description	Saves a translation or answer as pending review. `pasted` is set by the editor when text was pasted in.
//	@Tags			data-lab
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		contributionRequest	true	"Contribution"
//	@Success		201		{object}	ContributionAlias
//	@Failure		400		{object}	map[string]string
//	@Failure		403		{object}	map[string]string
//	@Failure		409		{object}	map[string]string	"already_contributed or language_closed"
//	@Router			/api/v1/data-lab/contributions [post]
func (h *Handler) ContributeHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var req contributionRequest
	if !bindJSON(c, &req) {
		return
	}
	contribution, err := h.dataLab.Contribute(c.Request.Context(), tok, usecase.ContributionInput{
		ItemID:   req.ItemID,
		Language: req.Language,
		Text:     req.Text,
		Pasted:   req.Pasted,
	})
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSONStatus(c, http.StatusCreated, contribution)
}

// NextReviewHandler godoc
//
//	@Summary		Get the next contribution to review
//	@Description	Returns the oldest pending contribution in the language written by someone else. 404 no_reviews when the queue is empty.
//	@Tags			data-lab
//	@Produce		json
//	@Security		BearerAuth
//	@Param			language	query		string	true	"Language code, e.g. sw"
//	@Success		200			{object}	ReviewItemAlias
//	@Failure		403			{object}	map[string]string	"not_reviewer"
//	@Failure		404			{object}	map[string]string	"no_reviews"
//	@Router			/api/v1/data-lab/reviews/next [get]
func (h *Handler) NextReviewHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var q languageQuery
	if !bindQuery(c, &q) {
		return
	}
	item, err := h.dataLab.NextReview(c.Request.Context(), tok, q.Language)
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, item)
}

type reviewRequest struct {
	ContributionID int64  `json:"contribution_id" binding:"required"`
	Decision       string `json:"decision" binding:"required"`
	Reason         string `json:"reason"`
	Note           string `json:"note"`
	CorrectedText  string `json:"corrected_text"`
}

// ReviewHandler godoc
//
//	@Summary		Review a contribution
//	@Description	Accept verifies the contribution. Correct verifies it with the reviewer's corrected_text, keeping the original on the contribution. Reject needs a reason (inaccurate, incomplete, machine_translated, off_topic, other) and reopens the item for others.
//	@Tags			data-lab
//	@Accept			json
//	@Security		BearerAuth
//	@Param			body	body	reviewRequest	true	"Review"
//	@Success		204
//	@Failure		400	{object}	map[string]string
//	@Failure		403	{object}	map[string]string	"not_reviewer or own_contribution"
//	@Failure		409	{object}	map[string]string	"already_reviewed"
//	@Router			/api/v1/data-lab/reviews [post]
func (h *Handler) ReviewHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var req reviewRequest
	if !bindJSON(c, &req) {
		return
	}
	err := h.dataLab.Review(c.Request.Context(), tok, usecase.ReviewInput{
		ContributionID: req.ContributionID,
		Decision:       req.Decision,
		Reason:         req.Reason,
		Note:           req.Note,
		CorrectedText:  req.CorrectedText,
	})
	if err != nil {
		dataLabError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
