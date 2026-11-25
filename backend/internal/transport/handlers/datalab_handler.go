package handlers

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"

	"backend/internal/usecase"
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

// ProgressHandler godoc
//
//	@Summary		Live progress per language
//	@Description	Verified and pending counts, members, reviewers, and whether each target language is open. Signed-in clients also receive data-lab.progress messages on /ws as counts change.
//	@Tags			data-lab
//	@Produce		json
//	@Success		200	{array}		LanguageProgressAlias
//	@Failure		500	{object}	map[string]string
//	@Router			/api/v1/data-lab/progress [get]
func (h *Handler) ProgressHandler(c *gin.Context) {
	progress, err := h.dataLab.Progress(c.Request.Context())
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, progress)
}

type featuresResponse struct {
	// Voice is true when recordings can be stored (object storage is set up).
	Voice bool `json:"voice"`
	// Video is true when signs can be recorded on camera; it needs the same storage.
	Video bool `json:"video"`
}

// FeaturesHandler godoc
//
//	@Summary		Data Lab features
//	@Description	Which optional features this server has: voice and video are true when recordings can be stored.
//	@Tags			data-lab
//	@Produce		json
//	@Success		200	{object}	featuresResponse
//	@Router			/api/v1/data-lab/features [get]
func (h *Handler) FeaturesHandler(c *gin.Context) {
	stored := h.dataLab.VoiceAvailable()
	JSON(c, featuresResponse{Voice: stored, Video: stored})
}

// DataLabMeHandler godoc
//
//	@Summary		Get my Data Lab profile
//	@Description	Returns the volunteer's languages, levels, and consent. 403 onboarding_required when they have not joined yet.
//	@Tags			data-lab
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	VolunteerAlias
//	@Failure		401	{object}	map[string]string
//	@Failure		403	{object}	map[string]string
//	@Router			/api/v1/data-lab/me [get]
func (h *Handler) DataLabMeHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	v, err := h.dataLab.Me(c.Request.Context(), tok)
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, v)
}

type onboardingRequest struct {
	Name           string   `json:"name"`
	Languages      []string `json:"languages"`
	ConsentVersion string   `json:"consent_version"`
}

// OnboardHandler godoc
//
//	@Summary		Join the Data Lab or add languages
//	@Description	Records the volunteer's name, languages, and acceptance of the current consent. Calling it again adds languages and never lowers a level.
//	@Tags			data-lab
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		onboardingRequest	true	"Onboarding"
//	@Success		200		{object}	VolunteerAlias
//	@Failure		400		{object}	map[string]string
//	@Failure		401		{object}	map[string]string
//	@Failure		403		{object}	map[string]string	"consent_required"
//	@Router			/api/v1/data-lab/onboarding [post]
func (h *Handler) OnboardHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var req onboardingRequest
	if !bindJSON(c, &req) {
		return
	}
	v, err := h.dataLab.Onboard(c.Request.Context(), tok, usecase.OnboardingInput{
		Name:           req.Name,
		Languages:      req.Languages,
		ConsentVersion: req.ConsentVersion,
	})
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, v)
}

// AcceptVoiceConsentHandler godoc
//
//	@Summary		Agree to record your voice
//	@Description	Extends the volunteer's current consent to voice recordings, which are published with the dataset. Needed before recording.
//	@Tags			data-lab
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	VolunteerAlias
//	@Failure		401	{object}	map[string]string
//	@Failure		403	{object}	map[string]string	"onboarding_required or consent_required"
//	@Router			/api/v1/data-lab/consent/voice [post]
func (h *Handler) AcceptVoiceConsentHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	v, err := h.dataLab.AcceptVoiceConsent(c.Request.Context(), tok)
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, v)
}

// AcceptVideoConsentHandler godoc
//
//	@Summary		Agree to sign on camera
//	@Description	Extends the volunteer's current consent to video recordings of their signing, which show their face and hands and are published with the dataset. Needed before recording in a sign language.
//	@Tags			data-lab
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	VolunteerAlias
//	@Failure		401	{object}	map[string]string
//	@Failure		403	{object}	map[string]string	"onboarding_required or consent_required"
//	@Router			/api/v1/data-lab/consent/video [post]
func (h *Handler) AcceptVideoConsentHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	v, err := h.dataLab.AcceptVideoConsent(c.Request.Context(), tok)
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, v)
}

type languageQuery struct {
	Language string `form:"language" binding:"required"`
}

type taskQuery struct {
	Language string `form:"language" binding:"required"`
	Modality string `form:"modality"`
}

// NextTaskHandler godoc
//
//	@Summary		Get the next task in a language
//	@Description	In a spoken language, modality=text (the default) returns an item to translate or a prompt to answer, and modality=audio a verified translation in the language to read aloud: only translated, verified items are recorded. In a sign language, modality=video (its default and only modality) returns an English word or sentence to sign, words first. 404 no_tasks when the language has nothing left for this volunteer.
//	@Tags			data-lab
//	@Produce		json
//	@Security		BearerAuth
//	@Param			language	query		string	true	"Target language code, e.g. sw"
//	@Param			modality	query		string	false	"text (default) or audio; video for a sign language"
//	@Success		200			{object}	TaskAlias
//	@Failure		403			{object}	map[string]string
//	@Failure		404			{object}	map[string]string	"no_tasks"
//	@Failure		503			{object}	map[string]string	"voice_unavailable"
//	@Router			/api/v1/data-lab/tasks/next [get]
func (h *Handler) NextTaskHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var q taskQuery
	if !bindQuery(c, &q) {
		return
	}
	task, err := h.dataLab.NextTask(c.Request.Context(), tok, q.Language, q.Modality)
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, task)
}

type recordingRequest struct {
	ItemID      int64  `json:"item_id" binding:"required"`
	Language    string `json:"language" binding:"required"`
	ContentType string `json:"content_type" binding:"required"`
}

// StartRecordingHandler godoc
//
//	@Summary		Get a URL to upload a recording to
//	@Description	Returns a presigned URL (valid 15 minutes) the browser PUTs the recording to, with the returned content_type, then the key to submit with the contribution. In a spoken language: an audio recording, which needs voice consent and a verified translation of the item in the language. In a sign language: a video, which needs video consent, plus a second URL for the landmarks file (application/json) tracked while recording.
//	@Tags			data-lab
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		recordingRequest	true	"Recording"
//	@Success		201		{object}	RecordingUploadAlias
//	@Failure		400		{object}	map[string]string
//	@Failure		403		{object}	map[string]string	"voice_consent_required or video_consent_required"
//	@Failure		503		{object}	map[string]string	"voice_unavailable"
//	@Router			/api/v1/data-lab/recordings [post]
func (h *Handler) StartRecordingHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var req recordingRequest
	if !bindJSON(c, &req) {
		return
	}
	upload, err := h.dataLab.StartRecording(c.Request.Context(), tok, usecase.RecordingInput{
		ItemID:      req.ItemID,
		Language:    req.Language,
		ContentType: req.ContentType,
	})
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSONStatus(c, http.StatusCreated, upload)
}

type contributionRequest struct {
	ItemID   int64  `json:"item_id" binding:"required"`
	Language string `json:"language" binding:"required"`
	// Modality is "text" (the default) or "audio" in a spoken language, and
	// "video" (the default) in a sign language.
	Modality string `json:"modality"`
	// Text is the written contribution; ignored for a recording, whose
	// transcript is the verified translation it reads.
	Text string `json:"text"`
	// AudioKey is the key StartRecording returned, for a recording.
	AudioKey string `json:"audio_key"`
	// VideoKey is the key StartRecording returned, for a sign.
	VideoKey string `json:"video_key"`
	// LandmarksKey is the landmarks_key StartRecording returned, for a sign
	// whose landmarks were tracked and uploaded; leave it empty otherwise.
	LandmarksKey string `json:"landmarks_key"`
	Pasted       bool   `json:"pasted"`
}

// ContributeHandler godoc
//
//	@Summary		Submit a contribution
//	@Description	Saves a translation or answer as pending review, written or recorded. A recording (modality=audio) reads the item's verified translation aloud and carries the audio_key it was uploaded to. A sign (modality=video) carries its video_key and, when tracked, its landmarks_key. `pasted` is set by the editor when text was pasted in.
//	@Tags			data-lab
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		contributionRequest	true	"Contribution"
//	@Success		201		{object}	ContributionAlias
//	@Failure		400		{object}	map[string]string
//	@Failure		403		{object}	map[string]string
//	@Failure		409		{object}	map[string]string	"already_contributed"
//	@Router			/api/v1/data-lab/contributions [post]
func (h *Handler) ContributeHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var req contributionRequest
	if !bindJSON(c, &req) {
		return
	}
	contribution, err := h.dataLab.Contribute(c.Request.Context(), tok, usecase.ContributionInput{
		ItemID:   req.ItemID,
		Language: req.Language,
		Modality: req.Modality,
		Text:     req.Text,
		AudioKey: req.AudioKey,
		VideoKey: req.VideoKey,
		// The landmarks file is optional: a device that can't track hands still submits.
		LandmarksKey: req.LandmarksKey,
		Pasted:       req.Pasted,
	})
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSONStatus(c, http.StatusCreated, contribution)
}

// NextReviewHandler godoc
//
//	@Summary		Get the next contribution to review
//	@Description	Returns the oldest pending contribution in the language by someone else. A recording comes with audio_url to play it and read_text, the verified translation it reads. A sign comes with video_url and, when tracked, landmarks_url. 404 no_reviews when the queue is empty.
//	@Tags			data-lab
//	@Produce		json
//	@Security		BearerAuth
//	@Param			language	query		string	true	"Language code, e.g. sw"
//	@Success		200			{object}	ReviewItemAlias
//	@Failure		403			{object}	map[string]string	"not_reviewer"
//	@Failure		404			{object}	map[string]string	"no_reviews"
//	@Router			/api/v1/data-lab/reviews/next [get]
func (h *Handler) NextReviewHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var q languageQuery
	if !bindQuery(c, &q) {
		return
	}
	item, err := h.dataLab.NextReview(c.Request.Context(), tok, q.Language)
	if err != nil {
		dataLabError(c, err)
		return
	}
	JSON(c, item)
}

type reviewRequest struct {
	ContributionID int64  `json:"contribution_id" binding:"required"`
	Decision       string `json:"decision" binding:"required"`
	Reason         string `json:"reason"`
	Note           string `json:"note"`
	CorrectedText  string `json:"corrected_text"`
}

// ReviewHandler godoc
//
//	@Summary		Review a contribution
//	@Description	Accept verifies the contribution. Correct verifies written text with the reviewer's corrected_text, keeping the original on the contribution; recordings and signs can't be corrected. Reject needs a reason (inaccurate, incomplete, machine_translated, off_topic, unclear, other) and reopens the item for others.
//	@Tags			data-lab
//	@Accept			json
//	@Security		BearerAuth
//	@Param			body	body	reviewRequest	true	"Review"
//	@Success		204
//	@Failure		400	{object}	map[string]string
//	@Failure		403	{object}	map[string]string	"not_reviewer or own_contribution"
//	@Failure		409	{object}	map[string]string	"already_reviewed"
//	@Router			/api/v1/data-lab/reviews [post]
func (h *Handler) ReviewHandler(c *gin.Context) {
	tok, ok := currentToken(c)
	if !ok {
		return
	}
	var req reviewRequest
	if !bindJSON(c, &req) {
		return
	}
	err := h.dataLab.Review(c.Request.Context(), tok, usecase.ReviewInput{
		ContributionID: req.ContributionID,
		Decision:       req.Decision,
		Reason:         req.Reason,
		Note:           req.Note,
		CorrectedText:  req.CorrectedText,
	})
	if err != nil {
		dataLabError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}
