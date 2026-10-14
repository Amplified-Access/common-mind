package domain

// Language is a language the Data Lab works with. Target languages are the
// ones volunteers contribute in; source languages are what they translate from.
type Language struct {
	Code            string   `json:"code"`
	Name            string   `json:"name"`
	NativeName      string   `json:"native_name"`
	Role            string   `json:"role"`
	Script          string   `json:"script"`
	ExtraCharacters []string `json:"extra_characters"`
}

const (
	LanguageRoleTarget = "target"
	LanguageRoleSource = "source"
)

// CurrentConsentVersion is the consent text volunteers must have accepted to
// contribute. Bump it when the consent text changes; volunteers then accept
// again before their next contribution.
const CurrentConsentVersion = "2026-10-14"

// Member levels, per language. Promotion to reviewer or lead is manual.
const (
	LevelContributor = "contributor"
	LevelReviewer    = "reviewer"
	LevelLead        = "lead"
)

// Membership is a volunteer's standing in one language.
type Membership struct {
	LanguageCode string `json:"language_code"`
	Level        string `json:"level"`
}

// CanReview reports whether the level allows reviewing contributions.
func (m Membership) CanReview() bool {
	return m.Level == LevelReviewer || m.Level == LevelLead
}

// Volunteer is a signed-in Data Lab user with their languages and consent.
type Volunteer struct {
	ID             int64        `json:"id"`
	Name           string       `json:"name"`
	Email          string       `json:"email"`
	Languages      []Membership `json:"languages"`
	ConsentVersion string       `json:"consent_version"` // latest accepted, "" if none
}

// ConsentCurrent reports whether the volunteer has accepted the current consent.
func (v Volunteer) ConsentCurrent() bool {
	return v.ConsentVersion == CurrentConsentVersion
}

// Membership returns the volunteer's standing in a language.
func (v Volunteer) Membership(code string) (Membership, bool) {
	for _, m := range v.Languages {
		if m.LanguageCode == code {
			return m, true
		}
	}
	return Membership{}, false
}
