package domain

import "time"

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

// Item kinds.
const (
	KindTranslate = "translate" // render a source-language segment
	KindWrite     = "write"     // answer a civic prompt in your own language
)

// Contribution statuses.
const (
	StatusPending  = "pending"
	StatusVerified = "verified"
	StatusRejected = "rejected"
)

// MaxContributionLength bounds a single contribution, in characters.
const MaxContributionLength = 2000

// MinReviewersToOpen is how many reviewers a language needs before it accepts
// contributions, so every row can get a second speaker (ADR 0010).
const MinReviewersToOpen = 2

// CivicCategories are the civic topics items are tagged with. They match the
// ids in web/components/civic/data.ts.
var CivicCategories = []string{
	"community-problems", "public-services", "local-government", "elections",
	"accountability", "priorities", "rights", "public-meetings", "promises",
	"development", "feedback",
}

// Task is an item offered to a volunteer in one target language.
type Task struct {
	ItemID         int64  `json:"item_id"`
	Kind           string `json:"kind"`
	Category       string `json:"category"`
	Text           string `json:"text"`            // the segment to translate, or the prompt to answer
	TextLanguage   string `json:"text_language"`   // language Text is written in
	TargetLanguage string `json:"target_language"` // language the volunteer writes in
}

// Contribution is a volunteer's translation or answer for one item.
type Contribution struct {
	ID           int64     `json:"id"`
	ItemID       int64     `json:"item_id"`
	LanguageCode string    `json:"language_code"`
	Text         string    `json:"text"`
	Pasted       bool      `json:"pasted"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

// Review decisions.
const (
	DecisionAccept = "accept"
	DecisionReject = "reject"
)

// RejectReasons are the reasons a reviewer can give; a rejection needs one.
// "machine_translated" feeds the MT guard (ADR 0010).
var RejectReasons = []string{"inaccurate", "incomplete", "machine_translated", "off_topic", "other"}

// ReviewItem is a pending contribution shown to a reviewer with its item.
type ReviewItem struct {
	ContributionID int64     `json:"contribution_id"`
	Kind           string    `json:"kind"`
	Category       string    `json:"category"`
	ItemText       string    `json:"item_text"`
	ItemLanguage   string    `json:"item_language"`
	LanguageCode   string    `json:"language_code"`
	Text           string    `json:"text"`
	Pasted         bool      `json:"pasted"`
	SubmittedAt    time.Time `json:"submitted_at"`
}

// ContributionRef is what a review needs to know about the contribution.
type ContributionRef struct {
	ID            int64
	LanguageCode  string
	ContributorID int64
	Status        string
}

// ProgressEvent is the WebSocket message type carrying a LanguageProgress.
const ProgressEvent = "data-lab.progress"

// LanguageProgress is a target language's live counts.
type LanguageProgress struct {
	Code         string `json:"code"`
	Verified     int    `json:"verified"`
	Pending      int    `json:"pending"`
	Contributors int    `json:"contributors"` // members at any level
	Reviewers    int    `json:"reviewers"`    // reviewers and leads
	Open         bool   `json:"open"`         // enough reviewers to accept contributions
}
