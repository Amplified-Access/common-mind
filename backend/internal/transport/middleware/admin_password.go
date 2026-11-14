package middleware

import (
	"crypto/sha256"
	"crypto/subtle"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
)

// Wrong admin passwords allowed per IP: ten in a row, then one every five
// seconds, so guessing is hopelessly slow.
const (
	adminFailureBurst    = 10
	adminFailureInterval = 5 * time.Second
)

// AdminPassword lets a request through only when it carries
// "Authorization: Bearer <password>". The Data Lab admin sends the password
// its user typed. The comparison takes the same time whatever was sent, so
// timing can't reveal the password, and an empty password (or none
// configured) never matches. Responses are marked no-store: they hold
// volunteers' names, emails and contributions.
//
// Only wrong passwords are rate limited, per IP: past the limit, every
// request from that IP is refused (429), right password or not, so a guess
// can't be confirmed. Right passwords are never counted, because the web app
// calls this from its server: every admin's refreshes share that server's IP.
func AdminPassword(password string) gin.HandlerFunc {
	return adminPassword(password, rate.Every(adminFailureInterval), adminFailureBurst)
}

func adminPassword(password string, failureRate rate.Limit, failureBurst int) gin.HandlerFunc {
	want := sha256.Sum256([]byte(password))
	failures := newFailureLimiter(failureRate, failureBurst)
	return func(c *gin.Context) {
		c.Header("Cache-Control", "no-store")
		ip := c.ClientIP()
		if failures.exhausted(ip) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": gin.H{"code": "too_many_attempts", "message": "too many wrong passwords; try again in a minute"},
			})
			return
		}
		given, ok := strings.CutPrefix(c.GetHeader("Authorization"), "Bearer ")
		got := sha256.Sum256([]byte(given))
		if !ok || given == "" || password == "" || subtle.ConstantTimeCompare(got[:], want[:]) != 1 {
			failures.record(ip)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": gin.H{"code": "unauthorized", "message": "wrong password"},
			})
			return
		}
		c.Next()
	}
}

// failureLimiter counts failed attempts per IP.
type failureLimiter struct {
	mu       sync.Mutex
	rate     rate.Limit
	burst    int
	limiters map[string]*ipLimiter
}

func newFailureLimiter(r rate.Limit, burst int) *failureLimiter {
	return &failureLimiter{rate: r, burst: burst, limiters: make(map[string]*ipLimiter)}
}

// exhausted reports whether ip has used up its failed attempts for now.
func (f *failureLimiter) exhausted(ip string) bool {
	f.mu.Lock()
	defer f.mu.Unlock()
	l, ok := f.limiters[ip]
	return ok && l.limiter.Tokens() < 1
}

// record counts a failed attempt from ip.
func (f *failureLimiter) record(ip string) {
	f.mu.Lock()
	defer f.mu.Unlock()
	now := time.Now()
	l, ok := f.limiters[ip]
	if !ok {
		f.evictStale(now)
		l = &ipLimiter{limiter: rate.NewLimiter(f.rate, f.burst)}
		f.limiters[ip] = l
	}
	l.lastSeen = now
	l.limiter.Allow()
}

// evictStale forgets IPs with no failures for limiterTTL; by then their
// allowance has refilled anyway.
func (f *failureLimiter) evictStale(now time.Time) {
	for ip, l := range f.limiters {
		if now.Sub(l.lastSeen) > limiterTTL {
			delete(f.limiters, ip)
		}
	}
}
