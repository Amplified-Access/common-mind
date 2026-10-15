package usecase

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"mime"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"backend/internal/domain"
)

// recordingUploadTTL is how long a volunteer has to upload a recording once
// the upload URL is issued.
const recordingUploadTTL = 15 * time.Minute

// DataLabStore is the persistence the Data Lab use case depends on.
type DataLabStore interface {
	ListLanguages(ctx context.Context) ([]domain.Language, error)
	// GetVolunteer returns nil, nil when the Firebase user has not onboarded.
	GetVolunteer(ctx context.Context, firebaseUID string) (*domain.Volunteer, error)
	// SaveOnboarding upserts the user, adds memberships without lowering an
	// existing level, and records consent, in one transaction.
	SaveOnboarding(ctx context.Context, rec OnboardingRecord) (*domain.Volunteer, error)
	// SaveVoiceConsent marks the volunteer's consent of that version as
	// covering voice recordings.
	SaveVoiceConsent(ctx context.Context, userID int64, version string) error
	// CountReviewers counts reviewers and leads in a language.
	CountReviewers(ctx context.Context, language string) (int, error)
	// NextItem returns an item the volunteer hasn't done in the modality that
	// has no pending or verified contribution in the language and modality, or
	// nil, nil when none is left.
	NextItem(ctx context.Context, userID int64, language, modality string) (*domain.Task, error)
	// CreateContribution returns ErrNotFound for an unknown item and
	// ErrAlreadyContributed for a repeat by the same volunteer in the modality.
	CreateContribution(ctx context.Context, rec ContributionRecord) (*domain.Contribution, error)
	// NextPendingContribution returns the oldest pending contribution in the
	// language not written by the reviewer, or nil, nil when there is none.
	NextPendingContribution(ctx context.Context, reviewerID int64, language string) (*domain.ReviewItem, error)
	// GetContributionRef returns ErrNotFound for an unknown contribution.
	GetContributionRef(ctx context.Context, id int64) (*domain.ContributionRef, error)
	// SaveReview records the review and sets the contribution's status in one
	// transaction. Returns ErrAlreadyReviewed if another review won the race.
	SaveReview(ctx context.Context, rec ReviewRecord) error
	// Progress returns live counts for every enabled target language, or for
	// one when language is non-empty.
	Progress(ctx context.Context, language string) ([]domain.LanguageProgress, error)
}

// Broadcaster pushes a message to connected clients. *ws.Hub satisfies it.
type Broadcaster interface {
	Publish(msgType string, payload any) error
}

// DataLab is the application-layer interface for the volunteer platform.
type DataLab interface {
	ListLanguages(ctx context.Context) ([]domain.Language, error)
	// Me returns ErrNotOnboarded when the user has no Data Lab profile yet.
	Me(ctx context.Context, tok *FirebaseToken) (*domain.Volunteer, error)
	Onboard(ctx context.Context, tok *FirebaseToken, in OnboardingInput) (*domain.Volunteer, error)
	// AcceptVoiceConsent extends the volunteer's current consent to voice.
	AcceptVoiceConsent(ctx context.Context, tok *FirebaseToken) (*domain.Volunteer, error)
	// VoiceAvailable reports whether recordings can be stored.
	VoiceAvailable() bool
	// NextTask returns ErrNoTasks when the language has nothing left for the
	// volunteer in the modality ("text" when empty, or "audio").
	NextTask(ctx context.Context, tok *FirebaseToken, language, modality string) (*domain.Task, error)
	// StartRecording issues a URL to upload one recording to, directly from
	// the browser, under the volunteer's own prefix.
	StartRecording(ctx context.Context, tok *FirebaseToken, in RecordingInput) (*RecordingUpload, error)
	Contribute(ctx context.Context, tok *FirebaseToken, in ContributionInput) (*domain.Contribution, error)
	// NextReview returns ErrNoReviews when nothing is waiting in the language.
	NextReview(ctx context.Context, tok *FirebaseToken, language string) (*domain.ReviewItem, error)
	Review(ctx context.Context, tok *FirebaseToken, in ReviewInput) error
	Progress(ctx context.Context) ([]domain.LanguageProgress, error)
}

// ReviewInput is a reviewer's decision on one contribution.
type ReviewInput struct {
	ContributionID int64
	Decision       string
	Reason         string
	Note           string
	CorrectedText  string // for DecisionCorrect
}

// ReviewRecord is a validated review, ready to persist.
type ReviewRecord struct {
	ContributionID int64
	ReviewerID     int64
	Decision       string
	Reason         string // "" when accepted
	Note           string
	CorrectedText  string // "" unless corrected
	Status         string // the contribution's new status
}

// ContributionInput is a volunteer's submission for one item: text, or a
// recording (already uploaded to AudioKey) with an optional transcript.
type ContributionInput struct {
	ItemID   int64
	Language string
	Modality string // "text" when empty
	Text     string // the text, or a recording's transcript
	AudioKey string // for a recording: the key StartRecording issued
	Pasted   bool
}

// ContributionRecord is a validated contribution, ready to persist.
type ContributionRecord struct {
	ItemID         int64
	Language       string
	ContributorID  int64
	Modality       string
	Text           string
	AudioKey       string // "" unless a recording
	Pasted         bool
	ConsentVersion string
}

// RecordingInput asks to upload a recording for an item.
type RecordingInput struct {
	ItemID      int64
	Language    string
	ContentType string // what the browser recorded, e.g. "audio/webm;codecs=opus"
}

// RecordingUpload is where to upload a recording. The browser PUTs the file
// to UploadURL with ContentType, then submits Key with the contribution.
type RecordingUpload struct {
	UploadURL   string `json:"upload_url"`
	Key         string `json:"key"`
	ContentType string `json:"content_type"`
}

// OnboardingInput is what a volunteer submits when joining or adding languages.
type OnboardingInput struct {
	Name           string
	Languages      []string
	ConsentVersion string
}

// OnboardingRecord is a validated onboarding, ready to persist.
type OnboardingRecord struct {
	FirebaseUID    string
	Name           string
	Email          string
	PhotoURL       string
	Languages      []string
	ConsentVersion string
}

type dataLab struct {
	store       DataLabStore
	broadcaster Broadcaster    // nil disables live progress
	storage     StorageService // nil disables voice recordings
}

// NewDataLab constructs the Data Lab use case. broadcaster and storage may be
// nil: without storage, volunteers can write but not record.
func NewDataLab(store DataLabStore, broadcaster Broadcaster, storage StorageService) DataLab {
	return &dataLab{store: store, broadcaster: broadcaster, storage: storage}
}

func (d *dataLab) VoiceAvailable() bool { return d.storage != nil }

func (d *dataLab) ListLanguages(ctx context.Context) ([]domain.Language, error) {
	return d.store.ListLanguages(ctx)
}

func (d *dataLab) Me(ctx context.Context, tok *FirebaseToken) (*domain.Volunteer, error) {
	v, err := d.store.GetVolunteer(ctx, tok.UID)
	if err != nil {
		return nil, err
	}
	if v == nil {
		return nil, ErrNotOnboarded
	}
	return v, nil
}

func (d *dataLab) Onboard(ctx context.Context, tok *FirebaseToken, in OnboardingInput) (*domain.Volunteer, error) {
	if in.ConsentVersion != domain.CurrentConsentVersion {
		return nil, ErrConsentOutdated
	}
	name := strings.TrimSpace(in.Name)
	if name == "" {
		return nil, invalid("name is required")
	}

	langs, err := d.store.ListLanguages(ctx)
	if err != nil {
		return nil, err
	}
	targets := make(map[string]bool, len(langs))
	for _, l := range langs {
		targets[l.Code] = l.Role == domain.LanguageRoleTarget
	}

	var codes []string
	seen := make(map[string]bool)
	for _, code := range in.Languages {
		if seen[code] {
			continue
		}
		if !targets[code] {
			return nil, invalid("unknown language: " + code)
		}
		seen[code] = true
		codes = append(codes, code)
	}
	if len(codes) == 0 {
		return nil, invalid("choose at least one language")
	}

	return d.store.SaveOnboarding(ctx, OnboardingRecord{
		FirebaseUID:    tok.UID,
		Name:           name,
		Email:          tok.Email,
		PhotoURL:       tok.PhotoURL,
		Languages:      codes,
		ConsentVersion: in.ConsentVersion,
	})
}

// contributorIn loads the volunteer and checks they may contribute in the
// language: onboarded, current consent, a member, and the language open.
func (d *dataLab) contributorIn(ctx context.Context, tok *FirebaseToken, language string) (*domain.Volunteer, error) {
	v, err := d.Me(ctx, tok)
	if err != nil {
		return nil, err
	}
	if !v.ConsentCurrent() {
		return nil, ErrConsentOutdated
	}
	if _, ok := v.Membership(language); !ok {
		return nil, ErrNotMember
	}
	reviewers, err := d.store.CountReviewers(ctx, language)
	if err != nil {
		return nil, err
	}
	if reviewers < domain.MinReviewersToOpen {
		return nil, ErrLanguageClosed
	}
	return v, nil
}

func (d *dataLab) AcceptVoiceConsent(ctx context.Context, tok *FirebaseToken) (*domain.Volunteer, error) {
	v, err := d.Me(ctx, tok)
	if err != nil {
		return nil, err
	}
	if !v.ConsentCurrent() {
		return nil, ErrConsentOutdated
	}
	if err := d.store.SaveVoiceConsent(ctx, v.ID, v.ConsentVersion); err != nil {
		return nil, err
	}
	v.VoiceConsent = true
	return v, nil
}

// modalityOf validates a modality, defaulting to text.
func modalityOf(m string) (string, error) {
	switch m {
	case "", domain.ModalityText:
		return domain.ModalityText, nil
	case domain.ModalityAudio:
		return domain.ModalityAudio, nil
	}
	return "", invalid("modality must be text or audio")
}

// canRecord checks voice is set up and the volunteer agreed to record.
func (d *dataLab) canRecord(v *domain.Volunteer) error {
	if d.storage == nil {
		return ErrVoiceUnavailable
	}
	if !v.CanRecord() {
		return ErrVoiceConsentRequired
	}
	return nil
}

func (d *dataLab) NextTask(ctx context.Context, tok *FirebaseToken, language, modality string) (*domain.Task, error) {
	modality, err := modalityOf(modality)
	if err != nil {
		return nil, err
	}
	v, err := d.contributorIn(ctx, tok, language)
	if err != nil {
		return nil, err
	}
	if modality == domain.ModalityAudio {
		if err := d.canRecord(v); err != nil {
			return nil, err
		}
	}
	task, err := d.store.NextItem(ctx, v.ID, language, modality)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, ErrNoTasks
	}
	return task, nil
}

func (d *dataLab) StartRecording(ctx context.Context, tok *FirebaseToken, in RecordingInput) (*RecordingUpload, error) {
	v, err := d.contributorIn(ctx, tok, in.Language)
	if err != nil {
		return nil, err
	}
	if err := d.canRecord(v); err != nil {
		return nil, err
	}
	// "audio/webm;codecs=opus" → "audio/webm": the browser uploads with the
	// base type, which the presigned URL is bound to.
	contentType, _, err := mime.ParseMediaType(in.ContentType)
	ext, ok := domain.RecordingTypes[contentType]
	if err != nil || !ok {
		return nil, invalid("this browser records in a format the Data Lab can't take; try Chrome, Firefox or Safari")
	}
	name := make([]byte, 16)
	if _, err := rand.Read(name); err != nil {
		return nil, fmt.Errorf("data lab: recording name: %w", err)
	}
	key := domain.RecordingPrefix(in.Language, v.ID) + hex.EncodeToString(name) + ext
	url, err := d.storage.PresignUpload(ctx, key, contentType, recordingUploadTTL)
	if err != nil {
		return nil, err
	}
	return &RecordingUpload{UploadURL: url, Key: key, ContentType: contentType}, nil
}

// checkRecording confirms the recording is the volunteer's own, in the
// language, and was uploaded in full as audio within the size limit.
func (d *dataLab) checkRecording(ctx context.Context, key, language string, userID int64) error {
	name, ok := strings.CutPrefix(key, domain.RecordingPrefix(language, userID))
	if !ok || name == "" || strings.Contains(name, "/") {
		return invalid("that recording isn't yours to submit; record it again")
	}
	info, err := d.storage.Stat(ctx, key)
	if errors.Is(err, ErrObjectNotFound) {
		return invalid("the recording didn't finish uploading; record it again")
	}
	if err != nil {
		return err
	}
	if !strings.HasPrefix(info.ContentType, "audio/") {
		return invalid("that file isn't a recording; record it again")
	}
	if info.Size == 0 || info.Size > domain.MaxRecordingBytes {
		return invalid("keep recordings to a few minutes")
	}
	return nil
}

func (d *dataLab) Contribute(ctx context.Context, tok *FirebaseToken, in ContributionInput) (*domain.Contribution, error) {
	modality, err := modalityOf(in.Modality)
	if err != nil {
		return nil, err
	}
	v, err := d.contributorIn(ctx, tok, in.Language)
	if err != nil {
		return nil, err
	}
	rec := ContributionRecord{
		ItemID:         in.ItemID,
		Language:       in.Language,
		ContributorID:  v.ID,
		Modality:       modality,
		Text:           strings.TrimSpace(in.Text),
		Pasted:         in.Pasted,
		ConsentVersion: v.ConsentVersion,
	}
	if rec.Text == "" && modality == domain.ModalityText {
		return nil, invalid("write something before submitting")
	}
	if utf8.RuneCountInString(rec.Text) > domain.MaxContributionLength {
		return nil, invalid("keep it under 2,000 characters")
	}
	if modality == domain.ModalityAudio {
		if err := d.canRecord(v); err != nil {
			return nil, err
		}
		if err := d.checkRecording(ctx, in.AudioKey, in.Language, v.ID); err != nil {
			return nil, err
		}
		rec.AudioKey = in.AudioKey
	}
	c, err := d.store.CreateContribution(ctx, rec)
	if err != nil {
		return nil, err
	}
	d.publishProgress(ctx, in.Language)
	return c, nil
}

// reviewerIn loads the volunteer and checks they may review in the language.
func (d *dataLab) reviewerIn(ctx context.Context, tok *FirebaseToken, language string) (*domain.Volunteer, error) {
	v, err := d.Me(ctx, tok)
	if err != nil {
		return nil, err
	}
	if !v.ConsentCurrent() {
		return nil, ErrConsentOutdated
	}
	if m, ok := v.Membership(language); !ok || !m.CanReview() {
		return nil, ErrNotReviewer
	}
	return v, nil
}

func (d *dataLab) NextReview(ctx context.Context, tok *FirebaseToken, language string) (*domain.ReviewItem, error) {
	v, err := d.reviewerIn(ctx, tok, language)
	if err != nil {
		return nil, err
	}
	item, err := d.store.NextPendingContribution(ctx, v.ID, language)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrNoReviews
	}
	if item.AudioKey != "" && d.storage != nil {
		item.AudioURL = d.storage.PublicURL(item.AudioKey)
	}
	return item, nil
}

func (d *dataLab) Review(ctx context.Context, tok *FirebaseToken, in ReviewInput) error {
	rec := ReviewRecord{ContributionID: in.ContributionID, Decision: in.Decision, Note: strings.TrimSpace(in.Note)}
	switch in.Decision {
	case domain.DecisionAccept:
		rec.Status = domain.StatusVerified
	case domain.DecisionCorrect:
		rec.CorrectedText = strings.TrimSpace(in.CorrectedText)
		if rec.CorrectedText == "" {
			return invalid("write the corrected text")
		}
		if utf8.RuneCountInString(rec.CorrectedText) > domain.MaxContributionLength {
			return invalid("keep it under 2,000 characters")
		}
		rec.Status = domain.StatusVerified
	case domain.DecisionReject:
		if !slices.Contains(domain.RejectReasons, in.Reason) {
			return invalid("choose a reason for rejecting")
		}
		rec.Reason = in.Reason
		rec.Status = domain.StatusRejected
	default:
		return invalid("decision must be accept, correct, or reject")
	}

	ref, err := d.store.GetContributionRef(ctx, in.ContributionID)
	if err != nil {
		return err
	}
	v, err := d.reviewerIn(ctx, tok, ref.LanguageCode)
	if err != nil {
		return err
	}
	if ref.ContributorID == v.ID {
		return ErrOwnContribution
	}
	if ref.Status != domain.StatusPending {
		return ErrAlreadyReviewed
	}
	if rec.Decision == domain.DecisionCorrect && rec.CorrectedText == strings.TrimSpace(ref.Text) {
		return invalid("the correction is the same as the original; choose Accept instead")
	}
	rec.ReviewerID = v.ID
	if err := d.store.SaveReview(ctx, rec); err != nil {
		return err
	}
	d.publishProgress(ctx, ref.LanguageCode)
	return nil
}

func (d *dataLab) Progress(ctx context.Context) ([]domain.LanguageProgress, error) {
	return d.store.Progress(ctx, "")
}

// publishProgress pushes a language's new counts to connected clients. It is
// best-effort: the write already succeeded, so failures are only logged.
func (d *dataLab) publishProgress(ctx context.Context, language string) {
	if d.broadcaster == nil {
		return
	}
	p, err := d.store.Progress(ctx, language)
	if err != nil || len(p) == 0 {
		slog.Warn("data lab: load progress for broadcast", "language", language, "error", err)
		return
	}
	if err := d.broadcaster.Publish(domain.ProgressEvent, p[0]); err != nil {
		slog.Warn("data lab: broadcast progress", "language", language, "error", err)
	}
}
