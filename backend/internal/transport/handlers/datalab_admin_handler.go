package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"backend/internal/usecase"
)

// WithDataLabAdmin enables the Data Lab admin's routes under /api/v1/admin,
// behind the shared admin password. They stay off unless both are set.
func (h *Handler) WithDataLabAdmin(admin usecase.DataLabAdmin, password string) *Handler {
	h.dataLabAdmin = admin
	h.adminPassword = password
	return h
}

// queryInt reads an optional whole-number query parameter; absent is 0.
// It writes a 400 and returns false when the value isn't a number.
func queryInt(c *gin.Context, name string) (int64, bool) {
	raw := c.Query(name)
	if raw == "" {
		return 0, true
	}
	n, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		JSONError(c, http.StatusBadRequest, "invalid_input", name+" must be a number")
		return 0, false
	}
	return n, true
}

// AdminTranslatorsHandler godoc
//
//	@Summary		List translators (admin)
//	@Description	Every volunteer who joined a language or contributed, most contributions first, with their counts by modality and status and the reviews they made. language narrows the list and the counts to one language.
//	@Tags			admin
//	@Produce		json
//	@Security		AdminPassword
//	@Param			language	query		string	false	"Target language code, e.g. sw"
//	@Success		200			{array}		TranslatorAlias
//	@Failure		401			{object}	map[string]string
//	@Failure		429			{object}	map[string]string
//	@Router			/api/v1/admin/data-lab/translators [get]
func (h *Handler) AdminTranslatorsHandler(c *gin.Context) {
	translators, err := h.dataLabAdmin.Translators(c.Request.Context(), c.Query("language"))
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, translators)
}

// AdminTranslatorHandler godoc
//
//	@Summary		Get one translator (admin)
//	@Description	One volunteer with their counts across every language.
//	@Tags			admin
//	@Produce		json
//	@Security		AdminPassword
//	@Param			id	path		int	true	"Volunteer ID"
//	@Success		200	{object}	TranslatorAlias
//	@Failure		400	{object}	map[string]string
//	@Failure		401	{object}	map[string]string
//	@Failure		404	{object}	map[string]string
//	@Router			/api/v1/admin/data-lab/translators/{id} [get]
func (h *Handler) AdminTranslatorHandler(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		JSONError(c, http.StatusBadRequest, "invalid_input", "id must be a number")
		return
	}
	t, err := h.dataLabAdmin.Translator(c.Request.Context(), id)
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, t)
}

// AdminContributionsHandler godoc
//
//	@Summary		List contributions (admin)
//	@Description	Contributions newest first, each with the item's text beside what the volunteer entered, and its review. total counts every match.
//	@Tags			admin
//	@Produce		json
//	@Security		AdminPassword
//	@Param			contributor	query		int		false	"Volunteer ID"
//	@Param			language	query		string	false	"Target language code"
//	@Param			status		query		string	false	"pending, verified, or rejected"
//	@Param			modality	query		string	false	"text, audio, or video"
//	@Param			limit		query		int		false	"Page size: 50 by default, at most 200"
//	@Param			offset		query		int		false	"Rows to skip"
//	@Success		200			{object}	AdminContributionPageAlias
//	@Failure		400			{object}	map[string]string
//	@Failure		401			{object}	map[string]string
//	@Router			/api/v1/admin/data-lab/contributions [get]
func (h *Handler) AdminContributionsHandler(c *gin.Context) {
	contributor, ok := queryInt(c, "contributor")
	if !ok {
		return
	}
	limit, ok := queryInt(c, "limit")
	if !ok {
		return
	}
	offset, ok := queryInt(c, "offset")
	if !ok {
		return
	}
	page, err := h.dataLabAdmin.Contributions(c.Request.Context(), usecase.ContributionFilter{
		ContributorID: contributor,
		Language:      c.Query("language"),
		Status:        c.Query("status"),
		Modality:      c.Query("modality"),
		Limit:         int(limit),
		Offset:        int(offset),
	})
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, page)
}

type levelRequest struct {
	// Level is contributor, reviewer, or lead.
	Level string `json:"level" binding:"required"`
}

// AdminSetLevelHandler godoc
//
//	@Summary		Set a volunteer's level in a language
//	@Description	Makes a volunteer a contributor, reviewer, or lead in a language they joined. A reviewer can review others' work in that language. Needs the admin password.
//	@Tags			admin
//	@Accept			json
//	@Security		AdminPassword
//	@Param			id			path	int				true	"Volunteer ID"
//	@Param			language	path	string			true	"Language code, e.g. ugn"
//	@Param			body		body	levelRequest	true	"Level"
//	@Success		204
//	@Failure		400	{object}	map[string]string	"invalid_input: not a level"
//	@Failure		401	{object}	map[string]string
//	@Failure		404	{object}	map[string]string	"not_found: they haven't joined the language"
//	@Router			/api/v1/admin/data-lab/translators/{id}/languages/{language} [put]
func (h *Handler) AdminSetLevelHandler(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		JSONError(c, http.StatusBadRequest, "invalid_input", "id must be a number")
		return
	}
	var req levelRequest
	if !bindJSON(c, &req) {
		return
	}
	if err := h.dataLabAdmin.SetLevel(c.Request.Context(), id, c.Param("language"), req.Level); err != nil {
		dataLabError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
