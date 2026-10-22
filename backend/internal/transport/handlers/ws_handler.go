package handlers

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	ws "backend/internal/infrastructure/ws"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// In debug mode (local dev) all origins are allowed so browsers can connect
	// from any port. In staging/production, restrict to BLUEPRINT_WS_ALLOWED_ORIGIN.
	CheckOrigin: func(r *http.Request) bool {
		if gin.IsDebugging() {
			return true
		}
		return originAllowed(r.Header.Get("Origin"), os.Getenv("BLUEPRINT_WS_ALLOWED_ORIGIN"))
	},
}

// originAllowed reports whether origin is one of the comma-separated allowed
// origins: the main site and the standalone Data Lab are deployed apart.
func originAllowed(origin, allowed string) bool {
	if origin == "" {
		return false
	}
	for _, o := range strings.Split(allowed, ",") {
		if strings.TrimSpace(o) == origin {
			return true
		}
	}
	return false
}

// WsHandler godoc
//
//	@Summary		Open a WebSocket connection
//	@Description	Upgrades HTTP to WebSocket. Pass a Firebase ID token as `?token=<token>`. Returns 401 when the token is missing or invalid.
//	@Tags			websocket
//	@Produce		json
//	@Param			token	query		string	true	"Firebase ID token"
//	@Success		101		{string}	string	"Switching Protocols"
//	@Failure		401		{object}	map[string]string
//	@Router			/ws [get]
func (h *Handler) WsHandler(c *gin.Context) {
	if h.verifier != nil {
		token := c.Query("token")
		if token == "" {
			JSONError(c, http.StatusUnauthorized, "unauthorized", "missing token")
			return
		}
		if _, err := h.verifier.VerifyIDToken(c.Request.Context(), token); err != nil {
			JSONError(c, http.StatusUnauthorized, "unauthorized", "invalid or expired token")
			return
		}
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		// Upgrader already wrote the error response.
		return
	}

	client := ws.NewClient(h.hub, conn)
	go client.WritePump()
	go client.ReadPump()
}
