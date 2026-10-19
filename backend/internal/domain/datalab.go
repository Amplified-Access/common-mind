package domain

import (
	"fmt"
	"hash/fnv"
	"time"
)

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
	// VoiceConsent reports whether that consent also covers voice recordings,
	// which volunteers accept separately before recording.
	VoiceConsent bool `json:"voice_consent"`
}

// ConsentCurrent reports whether the volunteer has accepted the current consent.
func (v Volunteer) ConsentCurrent() bool {
	return v.ConsentVersion == CurrentConsentVersion
}

// CanRecord reports whether the volunteer's current consent covers voice.
func (v Volunteer) CanRecord() bool {
	return v.ConsentCurrent() && v.VoiceConsent
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

// Modalities: how a contribution was given. A recording reads a verified
// written translation aloud, so voice follows text: an item is recorded in a
// language once its translation there is verified.
const (
	ModalityText  = "text"
	ModalityAudio = "audio"
)

// MaxRecordingBytes bounds one recording: a few minutes of compressed speech.
const MaxRecordingBytes = 10 << 20

// RecordingTypes are the audio types browsers record, with the file
// extension each is stored under.
var RecordingTypes = map[string]string{
	"audio/webm": ".webm", // Chrome, Edge, Firefox
	"audio/ogg":  ".ogg",  // Firefox
	"audio/mp4":  ".m4a",  // Safari
	"audio/mpeg": ".mp3",
	"audio/wav":  ".wav",
}

// RecordingPrefix is where a volunteer's recordings in a language are
// stored. A recording is only accepted from under its contributor's prefix.
func RecordingPrefix(language string, userID int64) string {
	return fmt.Sprintf("data-lab/voice/%s/%d/", language, userID)
}

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
	Text           string `json:"text"`            // the segment to translate or prompt to answer; for a recording, the verified translation to read
	TextLanguage   string `json:"text_language"`   // language Text is written in
	TargetLanguage string `json:"target_language"` // language the volunteer writes in
	Modality       string `json:"modality"`        // text: write it; audio: read it aloud
}

// Contribution is a volunteer's translation or answer for one item.
type Contribution struct {
	ID           int64     `json:"id"`
	ItemID       int64     `json:"item_id"`
	LanguageCode string    `json:"language_code"`
	Modality     string    `json:"modality"`
	Text         string    `json:"text"` // "" for a recording: the text it reads is its transcript
	AudioKey     string    `json:"-"`
	Pasted       bool      `json:"pasted"`
	Status       string    `json:"status"`
	CreatedAt    time.Time `json:"created_at"`
}

// Review decisions. A correction verifies the contribution with the
// reviewer's corrected text; reviewers are chosen by the team, so their
// correction needs no further check.
const (
	DecisionAccept  = "accept"
	DecisionCorrect = "correct"
	DecisionReject  = "reject"
)

// RejectReasons are the reasons a reviewer can give; a rejection needs one.
// "machine_translated" feeds the MT guard (ADR 0010); "unclear" is for a
// recording too noisy, quiet or broken up to use.
var RejectReasons = []string{"inaccurate", "incomplete", "machine_translated", "off_topic", "unclear", "other"}

// ReviewItem is a pending contribution shown to a reviewer with its item.
type ReviewItem struct {
	ContributionID int64     `json:"contribution_id"`
	Kind           string    `json:"kind"`
	Category       string    `json:"category"`
	ItemText       string    `json:"item_text"`
	ItemLanguage   string    `json:"item_language"`
	LanguageCode   string    `json:"language_code"`
	Modality       string    `json:"modality"`
	Text           string    `json:"text"`                // "" for a recording
	ReadText       string    `json:"read_text,omitempty"` // for a recording: the verified translation it reads
	AudioKey       string    `json:"-"`
	AudioURL       string    `json:"audio_url,omitempty"` // where the reviewer plays a recording
	Pasted         bool      `json:"pasted"`
	SubmittedAt    time.Time `json:"submitted_at"`
}

// ContributionRef is what a review needs to know about the contribution.
type ContributionRef struct {
	ID            int64
	LanguageCode  string
	ContributorID int64
	Status        string
	Modality      string
	Text          string
}

// ProgressEvent is the WebSocket message type carrying a LanguageProgress.
const ProgressEvent = "data-lab.progress"

// LanguageProgress is a target language's live counts. Translated and
// Verified measure the written output: sentence pairs with English, from
// translate items; Recorded and RecordedVerified count recordings. Pending is the review queue.
type LanguageProgress struct {
	Code       string `json:"code"`
	Available  int    `json:"available"`  // translate items, the whole every language works from
	Translated int    `json:"translated"` // pairs pending review or verified
	Verified   int    `json:"verified"`   // pairs a second speaker approved
	// Recordings, of any kind of item, pending review or verified, and verified.
	Recorded         int `json:"recorded"`
	RecordedVerified int `json:"recorded_verified"`
	Pending          int `json:"pending"` // contributions of any kind awaiting review
}

// Dataset splits. A source's split is fixed when it is first imported.
const (
	SplitTrain = "train"
	SplitTest  = "test"
)

// SplitFor assigns a source to a split from its stable key: about one source
// in ten goes to test. Hashing the key keeps the assignment the same on every
// import and in every release (ADR 0011).
func SplitFor(key string) string {
	h := fnv.New32a()
	_, _ = h.Write([]byte(key))
	if h.Sum32()%10 == 0 {
		return SplitTest
	}
	return SplitTrain
}

// Public-domain licence identifiers. Neither has a licence document, so a
// source under either must link its evidence: the rights page or the statute
// section (ADR 0013).
const (
	LicencePublicDomain        = "public-domain"
	LicencePublicDomainStatute = "public-domain-statute"
)

// AllowedLicences are the only source licences the importer accepts: they
// allow redistribution and commercial reuse under the corpus's CC-BY-4.0
// release. Share-alike, non-commercial, no-derivatives, and unlicensed
// sources are refused (ADR 0013, docs/adr/0013-source-acquisition-and-licences.md).
var AllowedLicences = []string{
	"CC0-1.0",
	"CC-BY-2.0",
	"CC-BY-2.5",
	"CC-BY-3.0",
	"CC-BY-3.0-IGO",
	"CC-BY-4.0",
	LicencePublicDomain,
	LicencePublicDomainStatute,
}
