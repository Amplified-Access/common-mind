package domain

import "time"

// Translator is one volunteer's record in the Data Lab admin: who they are,
// their languages, and how much of their work stands where. With a language
// filter, the counts cover that language only.
type Translator struct {
	ID        int64                `json:"id"`
	Name      string               `json:"name"`
	Email     string               `json:"email"`
	Languages []TranslatorLanguage `json:"languages"`
	JoinedAt  time.Time            `json:"joined_at"`
	// Their contributions: written (translations and answers), recorded, and signed.
	Written  int `json:"written"`
	Recorded int `json:"recorded"`
	Signed   int `json:"signed"`
	// The same contributions by status. Corrected counts the verified ones a
	// reviewer corrected, so it is part of Verified.
	Pending   int `json:"pending"`
	Verified  int `json:"verified"`
	Corrected int `json:"corrected"`
	Rejected  int `json:"rejected"`
	// Reviewed counts the reviews they made of other volunteers' work.
	Reviewed int `json:"reviewed"`
	// LastActiveAt is their latest contribution or review; nil when none.
	LastActiveAt *time.Time `json:"last_active_at"`
}

// TranslatorLanguage is one of a translator's languages and how much they've
// contributed in it, whatever the filter. It covers the languages they joined
// (Level set) and any they contributed in without being a member now (Level "").
type TranslatorLanguage struct {
	LanguageCode  string `json:"language_code"`
	Level         string `json:"level"`
	Contributions int    `json:"contributions"`
}

// AdminContribution is one contribution as the admin sees it: the item's
// text beside what the volunteer entered, and the review, if any.
type AdminContribution struct {
	ID              int64  `json:"id"`
	ContributorID   int64  `json:"contributor_id"`
	ContributorName string `json:"contributor_name"`
	ItemID          int64  `json:"item_id"`
	Kind            string `json:"kind"`
	Category        string `json:"category"`
	SourceTitle     string `json:"source_title"`
	// ItemText is the segment translated or the prompt answered, in ItemLanguage.
	ItemText     string `json:"item_text"`
	ItemLanguage string `json:"item_language"`
	LanguageCode string `json:"language_code"`
	Modality     string `json:"modality"`
	// Text is what the volunteer wrote; "" for a recording.
	Text string `json:"text"`
	// ReadText is, for a recording, the verified translation it reads.
	ReadText    string       `json:"read_text,omitempty"`
	AudioKey    string       `json:"-"`
	AudioURL    string       `json:"audio_url,omitempty"`
	VideoKey    string       `json:"-"`
	VideoURL    string       `json:"video_url,omitempty"` // for a sign
	Pasted      bool         `json:"pasted"`
	Status      string       `json:"status"`
	SubmittedAt time.Time    `json:"submitted_at"`
	Review      *AdminReview `json:"review"` // nil while pending
}

// AdminReview is the review of a contribution and who made it.
type AdminReview struct {
	Decision      string    `json:"decision"`
	Reason        string    `json:"reason,omitempty"`
	Note          string    `json:"note,omitempty"`
	CorrectedText string    `json:"corrected_text,omitempty"`
	ReviewerID    int64     `json:"reviewer_id"`
	ReviewerName  string    `json:"reviewer_name"`
	ReviewedAt    time.Time `json:"reviewed_at"`
}

// AdminContributionPage is one page of contributions, newest first, and how
// many match the filter in all.
type AdminContributionPage struct {
	Total         int                 `json:"total"`
	Contributions []AdminContribution `json:"contributions"`
}
