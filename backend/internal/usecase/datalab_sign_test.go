package usecase

import (
	"context"
	"errors"
	"strings"
	"testing"

	"backend/internal/domain"
)

// signer is a USL contributor who agreed to be recorded on video.
func signer() *domain.Volunteer {
	return &domain.Volunteer{
		ID: 7,
		Languages: []domain.Membership{
			{LanguageCode: "ugn", Level: domain.LevelContributor, Modality: domain.ModalitySigned},
			{LanguageCode: "sw", Level: domain.LevelContributor, Modality: domain.ModalitySpoken},
		},
		ConsentVersion: domain.CurrentConsentVersion,
		VideoConsent:   true,
	}
}

func TestNextTask_SignLanguagesAreRecordedOnCamera(t *testing.T) {
	noConsent := signer()
	noConsent.VideoConsent = false
	tests := []struct {
		name         string
		storage      StorageService
		volunteer    *domain.Volunteer
		language     string
		modality     string
		wantErr      error
		wantModality string
	}{
		{name: "a sign language defaults to video", storage: &fakeStorage{}, volunteer: signer(), language: "ugn", modality: "", wantModality: domain.ModalityVideo},
		{name: "video asked for", storage: &fakeStorage{}, volunteer: signer(), language: "ugn", modality: domain.ModalityVideo, wantModality: domain.ModalityVideo},
		{name: "writing in a sign language", storage: &fakeStorage{}, volunteer: signer(), language: "ugn", modality: domain.ModalityText, wantErr: ErrInvalidInput},
		{name: "speaking in a sign language", storage: &fakeStorage{}, volunteer: signer(), language: "ugn", modality: domain.ModalityAudio, wantErr: ErrInvalidInput},
		{name: "video in a spoken language", storage: &fakeStorage{}, volunteer: signer(), language: "sw", modality: domain.ModalityVideo, wantErr: ErrInvalidInput},
		{name: "a spoken language still defaults to text", storage: nil, volunteer: signer(), language: "sw", modality: "", wantModality: domain.ModalityText},
		{name: "no video consent", storage: &fakeStorage{}, volunteer: noConsent, language: "ugn", wantErr: ErrVideoConsentRequired},
		{name: "storage not set up", storage: nil, volunteer: signer(), language: "ugn", wantErr: ErrVoiceUnavailable},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{volunteer: tt.volunteer}

			task, err := NewDataLab(store, nil, tt.storage).NextTask(context.Background(), &FirebaseToken{UID: "uid-7"}, tt.language, tt.modality)

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("NextTask() error = %v, want %v", err, tt.wantErr)
			}
			if tt.wantErr == nil && task.Modality != tt.wantModality {
				t.Errorf("task modality = %q, want %q", task.Modality, tt.wantModality)
			}
		})
	}
}

func TestStartRecording_SignLanguageGetsVideoAndLandmarksURLs(t *testing.T) {
	noConsent := signer()
	noConsent.VideoConsent = false
	tests := []struct {
		name        string
		storage     StorageService
		volunteer   *domain.Volunteer
		contentType string
		wantErr     error
		wantType    string
		wantExt     string
	}{
		{name: "webm from Chrome", storage: &fakeStorage{}, volunteer: signer(), contentType: "video/webm;codecs=vp9", wantType: "video/webm", wantExt: ".webm"},
		{name: "mp4 from Safari", storage: &fakeStorage{}, volunteer: signer(), contentType: "video/mp4", wantType: "video/mp4", wantExt: ".mp4"},
		{name: "audio in a sign language", storage: &fakeStorage{}, volunteer: signer(), contentType: "audio/webm", wantErr: ErrInvalidInput},
		{name: "no video consent", storage: &fakeStorage{}, volunteer: noConsent, contentType: "video/webm", wantErr: ErrVideoConsentRequired},
		{name: "storage not set up", storage: nil, volunteer: signer(), contentType: "video/webm", wantErr: ErrVoiceUnavailable},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Signing needs no verified translation: the task is the English text.
			store := &fakeStore{volunteer: tt.volunteer, translation: 0}

			upload, err := NewDataLab(store, nil, tt.storage).StartRecording(context.Background(), &FirebaseToken{UID: "uid-7"},
				RecordingInput{ItemID: 1, Language: "ugn", ContentType: tt.contentType})

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("StartRecording() error = %v, want %v", err, tt.wantErr)
			}
			if tt.wantErr != nil {
				return
			}
			if !strings.HasPrefix(upload.Key, "data-lab/sign/ugn/7/") || !strings.HasSuffix(upload.Key, tt.wantExt) {
				t.Errorf("key = %q, want one under the signer's ugn folder ending %s", upload.Key, tt.wantExt)
			}
			if upload.ContentType != tt.wantType || upload.UploadURL == "" {
				t.Errorf("upload = %+v, want a URL for %s", upload, tt.wantType)
			}
			if upload.LandmarksKey != domain.LandmarksKeyFor(upload.Key) || upload.LandmarksUploadURL == "" ||
				upload.LandmarksContentType != domain.LandmarksType {
				t.Errorf("landmarks = %q at %q, want the video's pair with its own URL", upload.LandmarksKey, upload.LandmarksUploadURL)
			}
		})
	}
}

func TestContribute_Sign_ChecksTheVideoAndItsLandmarks(t *testing.T) {
	const video = "data-lab/sign/ugn/7/0c9f2a.webm"
	const landmarks = "data-lab/sign/ugn/7/0c9f2a.landmarks.json"
	uploaded := func() *fakeStorage {
		return &fakeStorage{objects: map[string]ObjectInfo{
			video:                                      {Size: 4_000_000, ContentType: "video/webm"},
			landmarks:                                  {Size: 300_000, ContentType: "application/json"},
			"data-lab/sign/ugn/8/someone.webm":         {Size: 4_000_000, ContentType: "video/webm"},
			"data-lab/sign/ugn/7/huge.webm":            {Size: domain.MaxVideoBytes + 1, ContentType: "video/webm"},
			"data-lab/sign/ugn/7/voice.webm":           {Size: 48_000, ContentType: "audio/webm"},
			"data-lab/sign/ugn/7/other.landmarks.json": {Size: 300_000, ContentType: "application/json"},
			"data-lab/sign/ugn/7/bare.webm":            {Size: 4_000_000, ContentType: "video/webm"},
			"data-lab/sign/ugn/7/alone.webm":           {Size: 4_000_000, ContentType: "video/webm"},
			"data-lab/sign/ugn/7/bare.landmarks.json":  {Size: domain.MaxLandmarksBytes + 1, ContentType: "application/json"},
		}}
	}
	valid := ContributionInput{ItemID: 1, Language: "ugn", Modality: domain.ModalityVideo, VideoKey: video, LandmarksKey: landmarks}

	tests := []struct {
		name          string
		storage       StorageService
		mutate        func(in *ContributionInput)
		wantErr       error
		wantLandmarks string
	}{
		{name: "video with its landmarks", storage: uploaded(), wantLandmarks: landmarks},
		// A device that can't track hands still submits; landmarks can come from the video later.
		{name: "video without landmarks", storage: uploaded(), mutate: func(in *ContributionInput) { in.LandmarksKey = "" }},
		{name: "modality left to the language", storage: uploaded(), mutate: func(in *ContributionInput) { in.Modality = "" }, wantLandmarks: landmarks},
		{name: "typed text is dropped", storage: uploaded(), mutate: func(in *ContributionInput) { in.Text = "clinic" }, wantLandmarks: landmarks},
		{name: "landmarks of another take", storage: uploaded(), mutate: func(in *ContributionInput) { in.LandmarksKey = "data-lab/sign/ugn/7/other.landmarks.json" }, wantErr: ErrInvalidInput},
		{name: "landmarks too large", storage: uploaded(), mutate: func(in *ContributionInput) {
			in.VideoKey, in.LandmarksKey = "data-lab/sign/ugn/7/bare.webm", "data-lab/sign/ugn/7/bare.landmarks.json"
		}, wantErr: ErrInvalidInput},
		{name: "landmarks never uploaded", storage: uploaded(), mutate: func(in *ContributionInput) {
			in.VideoKey, in.LandmarksKey = "data-lab/sign/ugn/7/alone.webm", "data-lab/sign/ugn/7/alone.landmarks.json"
		}, wantErr: ErrInvalidInput},
		{name: "another signer's video", storage: uploaded(), mutate: func(in *ContributionInput) {
			in.VideoKey, in.LandmarksKey = "data-lab/sign/ugn/8/someone.webm", ""
		}, wantErr: ErrInvalidInput},
		{name: "a voice recording's folder", storage: uploaded(), mutate: func(in *ContributionInput) {
			in.VideoKey, in.LandmarksKey = "data-lab/voice/ugn/7/0c9f2a.webm", ""
		}, wantErr: ErrInvalidInput},
		{name: "not video", storage: uploaded(), mutate: func(in *ContributionInput) {
			in.VideoKey, in.LandmarksKey = "data-lab/sign/ugn/7/voice.webm", ""
		}, wantErr: ErrInvalidInput},
		{name: "video too large", storage: uploaded(), mutate: func(in *ContributionInput) {
			in.VideoKey, in.LandmarksKey = "data-lab/sign/ugn/7/huge.webm", ""
		}, wantErr: ErrInvalidInput},
		{name: "upload never finished", storage: uploaded(), mutate: func(in *ContributionInput) {
			in.VideoKey, in.LandmarksKey = "data-lab/sign/ugn/7/lost.webm", ""
		}, wantErr: ErrInvalidInput},
		{name: "storage not set up", storage: nil, wantErr: ErrVoiceUnavailable},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{volunteer: signer()}
			in := valid
			if tt.mutate != nil {
				tt.mutate(&in)
			}

			_, err := NewDataLab(store, nil, tt.storage).Contribute(context.Background(), &FirebaseToken{UID: "uid-7"}, in)

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Contribute() error = %v, want %v", err, tt.wantErr)
			}
			if tt.wantErr != nil {
				if store.contributed != nil {
					t.Error("contribution saved despite the error")
				}
				return
			}
			rec := store.contributed
			if rec.Modality != domain.ModalityVideo || rec.VideoKey != in.VideoKey || rec.LandmarksKey != tt.wantLandmarks ||
				rec.Text != "" || rec.AudioKey != "" || rec.ReadsContributionID != 0 {
				t.Errorf("saved %+v, want the video at %s with landmarks %q", rec, in.VideoKey, tt.wantLandmarks)
			}
		})
	}
}

func TestReview_ASignCanBeAcceptedOrRejectedButNotCorrected(t *testing.T) {
	reviewer := &domain.Volunteer{
		ID:             7,
		Languages:      []domain.Membership{{LanguageCode: "ugn", Level: domain.LevelReviewer, Modality: domain.ModalitySigned}},
		ConsentVersion: domain.CurrentConsentVersion,
	}
	sign := func() *domain.ContributionRef {
		return &domain.ContributionRef{ID: 3, LanguageCode: "ugn", ContributorID: 99, Status: domain.StatusPending, Modality: domain.ModalityVideo}
	}
	tests := []struct {
		name    string
		in      ReviewInput
		wantErr error
	}{
		{name: "accept", in: ReviewInput{ContributionID: 3, Decision: "accept"}},
		{name: "reject as unclear", in: ReviewInput{ContributionID: 3, Decision: "reject", Reason: "unclear"}},
		{name: "correct", in: ReviewInput{ContributionID: 3, Decision: "correct", CorrectedText: "CLINIC"}, wantErr: ErrInvalidInput},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{volunteer: reviewer, ref: sign()}

			err := NewDataLab(store, nil, &fakeStorage{}).Review(context.Background(), &FirebaseToken{UID: "uid-7"}, tt.in)

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("Review() error = %v, want %v", err, tt.wantErr)
			}
		})
	}
}

func TestAcceptVideoConsent_ExtendsTheCurrentConsent(t *testing.T) {
	outdated := signer()
	outdated.ConsentVersion = "old"
	tests := []struct {
		name      string
		volunteer *domain.Volunteer
		wantErr   error
	}{
		{name: "current consent", volunteer: signer()},
		{name: "not onboarded", volunteer: nil, wantErr: ErrNotOnboarded},
		{name: "outdated consent", volunteer: outdated, wantErr: ErrConsentOutdated},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{volunteer: tt.volunteer}

			v, err := NewDataLab(store, nil, &fakeStorage{}).AcceptVideoConsent(context.Background(), &FirebaseToken{UID: "uid-7"})

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("AcceptVideoConsent() error = %v, want %v", err, tt.wantErr)
			}
			if (tt.wantErr == nil) != (store.videoFor == 7) {
				t.Errorf("video consent saved for %d", store.videoFor)
			}
			if tt.wantErr == nil && !v.VideoConsent {
				t.Error("returned volunteer doesn't have the video consent")
			}
		})
	}
}
