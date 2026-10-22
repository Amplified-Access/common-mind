package handlers

import "testing"

func TestOriginAllowed(t *testing.T) {
	tests := []struct {
		name, origin, allowed string
		want                  bool
	}{
		{"single match", "https://commonmind.org", "https://commonmind.org", true},
		{"second of a list", "https://lab.example.org", "https://commonmind.org, https://lab.example.org", true},
		{"not listed", "https://evil.example", "https://commonmind.org,https://lab.example.org", false},
		{"nothing configured", "https://commonmind.org", "", false},
		{"no origin header", "", "https://commonmind.org", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := originAllowed(tt.origin, tt.allowed); got != tt.want {
				t.Errorf("originAllowed(%q, %q) = %v, want %v", tt.origin, tt.allowed, got, tt.want)
			}
		})
	}
}
