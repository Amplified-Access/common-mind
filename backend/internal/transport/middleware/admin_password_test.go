package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

func newAdminRouter(password string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/admin", AdminPassword(password), func(c *gin.Context) { c.Status(http.StatusOK) })
	return r
}

func adminRequest(r *gin.Engine, authorization string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodGet, "/admin", nil)
	if authorization != "" {
		req.Header.Set("Authorization", authorization)
	}
	rr := httptest.NewRecorder()
	r.ServeHTTP(rr, req)
	return rr
}

func TestAdminPassword(t *testing.T) {
	r := newAdminRouter("correct horse battery")

	tests := []struct {
		name          string
		authorization string
		want          int
	}{
		{"the right password", "Bearer correct horse battery", http.StatusOK},
		{"a wrong password", "Bearer wrong", http.StatusUnauthorized},
		{"the password with something added", "Bearer correct horse battery!", http.StatusUnauthorized},
		{"no password", "", http.StatusUnauthorized},
		{"an empty password", "Bearer ", http.StatusUnauthorized},
		{"the password without Bearer", "correct horse battery", http.StatusUnauthorized},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if rr := adminRequest(r, tt.authorization); rr.Code != tt.want {
				t.Errorf("expected %d, got %d", tt.want, rr.Code)
			}
		})
	}
}

func TestAdminPassword_TellsBrowsersNotToStoreTheResponse(t *testing.T) {
	r := newAdminRouter("correct horse battery")

	rr := adminRequest(r, "Bearer correct horse battery")

	if got := rr.Header().Get("Cache-Control"); got != "no-store" {
		t.Errorf("expected Cache-Control: no-store, got %q", got)
	}
}

func TestAdminPassword_RefusesEveryoneWithoutAPassword(t *testing.T) {
	r := newAdminRouter("")

	if rr := adminRequest(r, "Bearer "); rr.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rr.Code)
	}
}

func TestAdminPassword_NeverLimitsTheRightPassword(t *testing.T) {
	r := newAdminRouter("correct horse battery")

	// Every admin's refreshes come from the web app's server, so one IP.
	for i := range adminFailureBurst * 3 {
		if rr := adminRequest(r, "Bearer correct horse battery"); rr.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i+1, rr.Code)
		}
	}
}

func TestAdminPassword_StopsGuessingAfterTooManyWrongPasswords(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/admin", adminPassword("correct horse battery", rate.Every(time.Hour), 3), func(c *gin.Context) { c.Status(http.StatusOK) })

	for i := range 3 {
		if rr := adminRequest(r, "Bearer guess"); rr.Code != http.StatusUnauthorized {
			t.Fatalf("guess %d: expected 401, got %d", i+1, rr.Code)
		}
	}

	if rr := adminRequest(r, "Bearer guess"); rr.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429 after too many wrong passwords, got %d", rr.Code)
	}
	// Even the right password is refused for now, so a guess can't be confirmed.
	if rr := adminRequest(r, "Bearer correct horse battery"); rr.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429 for the right password while locked, got %d", rr.Code)
	}
}

func TestAdminPassword_RightPasswordsDontUseUpTheAllowance(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.GET("/admin", adminPassword("correct horse battery", rate.Every(time.Hour), 2), func(c *gin.Context) { c.Status(http.StatusOK) })

	adminRequest(r, "Bearer typo")
	for range 5 {
		adminRequest(r, "Bearer correct horse battery")
	}

	if rr := adminRequest(r, "Bearer another typo"); rr.Code != http.StatusUnauthorized {
		t.Errorf("expected a second wrong password to still get 401, got %d", rr.Code)
	}
}
