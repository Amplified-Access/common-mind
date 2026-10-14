package handlers

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
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
