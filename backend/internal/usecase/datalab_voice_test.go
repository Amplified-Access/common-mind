package usecase

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"backend/internal/domain"
)

// fakeStorage is a hand-written StorageService holding what was uploaded.
type fakeStorage struct{ objects map[string]ObjectInfo }

func (s *fakeStorage) PresignUpload(_ context.Context, key, _ string, _ time.Duration) (string, error) {
	return "https://r2.example/" + key + "?signed", nil
}

func (s *fakeStorage) Stat(_ context.Context, key string) (ObjectInfo, error) {
	info, ok := s.objects[key]
	if !ok {
		return ObjectInfo{}, ErrObjectNotFound
	}
	return info, nil
}

func (s *fakeStorage) Delete(context.Context, string) error { return nil }
func (s *fakeStorage) PublicURL(key string) string          { return "https://audio.example/" + key }

func voiceContributor() *domain.Volunteer {
	v := swahiliContributor()
	v.VoiceConsent = true
	return v
}

func TestStartRecording_NeedsVoiceAndAnAudioType(t *testing.T) {
	tests := []struct {
		name         string
		storage      StorageService
		volunteer    *domain.Volunteer
		contentType  string
		untranslated bool
		wantErr      error
		wantType     string
		wantExt      string
	}{
		{name: "webm from Chrome", storage: &fakeStorage{}, volunteer: voiceContributor(), contentType: "audio/webm;codecs=opus", wantType: "audio/webm", wantExt: ".webm"},
		{name: "mp4 from Safari", storage: &fakeStorage{}, volunteer: voiceContributor(), contentType: "Audio/MP4", wantType: "audio/mp4", wantExt: ".m4a"},
		{name: "voice not set up", storage: nil, volunteer: voiceContributor(), contentType: "audio/webm", wantErr: ErrVoiceUnavailable},
		{name: "no voice consent", storage: &fakeStorage{}, volunteer: swahiliContributor(), contentType: "audio/webm", wantErr: ErrVoiceConsentRequired},
		{name: "not audio", storage: &fakeStorage{}, volunteer: voiceContributor(), contentType: "image/png", wantErr: ErrInvalidInput},
		{name: "no verified translation", storage: &fakeStorage{}, volunteer: voiceContributor(), contentType: "audio/webm", untranslated: true, wantErr: ErrInvalidInput},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{volunteer: tt.volunteer, translation: 42}
			if tt.untranslated {
				store.translation = 0
			}

			upload, err := NewDataLab(store, nil, tt.storage).StartRecording(context.Background(), &FirebaseToken{UID: "uid-7"},
				RecordingInput{ItemID: 1, Language: "sw", ContentType: tt.contentType})

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("StartRecording() error = %v, want %v", err, tt.wantErr)
			}
			if tt.wantErr != nil {
				return
			}
			if !strings.HasPrefix(upload.Key, "data-lab/voice/sw/7/") || !strings.HasSuffix(upload.Key, tt.wantExt) {
				t.Errorf("key = %q, want one under the volunteer's sw folder ending %s", upload.Key, tt.wantExt)
			}
			if upload.ContentType != tt.wantType || upload.UploadURL == "" {
				t.Errorf("upload = %+v, want a URL for %s", upload, tt.wantType)
			}
		})
	}
}

func TestContribute_Recording_ChecksTheUpload(t *testing.T) {
	const key = "data-lab/voice/sw/7/0c9f2a.webm"
	uploaded := func() *fakeStorage {
		return &fakeStorage{objects: map[string]ObjectInfo{
			key:                                {Size: 48_000, ContentType: "audio/webm"},
			"data-lab/voice/sw/8/someone.webm": {Size: 48_000, ContentType: "audio/webm"},
			"data-lab/voice/sw/7/huge.webm":    {Size: domain.MaxRecordingBytes + 1, ContentType: "audio/webm"},
			"data-lab/voice/sw/7/page.webm":    {Size: 900, ContentType: "text/html"},
		}}
	}
	valid := ContributionInput{ItemID: 1, Language: "sw", Modality: domain.ModalityAudio, AudioKey: key}

	tests := []struct {
		name         string
		storage      StorageService
		volunteer    *domain.Volunteer
		untranslated bool
		mutate       func(in *ContributionInput)
		wantErr      error
	}{
		{name: "reading a verified translation", storage: uploaded(), volunteer: voiceContributor()},
		// The verified translation is the transcript, so typed text is dropped.
		{name: "typed text is ignored", storage: uploaded(), volunteer: voiceContributor(), mutate: func(in *ContributionInput) { in.Text = "something else" }},
		{name: "no verified translation", storage: uploaded(), volunteer: voiceContributor(), untranslated: true, wantErr: ErrInvalidInput},
		{name: "another volunteer's recording", storage: uploaded(), volunteer: voiceContributor(), mutate: func(in *ContributionInput) { in.AudioKey = "data-lab/voice/sw/8/someone.webm" }, wantErr: ErrInvalidInput},
		{name: "a recording for another language", storage: uploaded(), volunteer: voiceContributor(), mutate: func(in *ContributionInput) { in.AudioKey = "data-lab/voice/luo/7/0c9f2a.webm" }, wantErr: ErrInvalidInput},
		{name: "upload never finished", storage: uploaded(), volunteer: voiceContributor(), mutate: func(in *ContributionInput) { in.AudioKey = "data-lab/voice/sw/7/lost.webm" }, wantErr: ErrInvalidInput},
		{name: "too large", storage: uploaded(), volunteer: voiceContributor(), mutate: func(in *ContributionInput) { in.AudioKey = "data-lab/voice/sw/7/huge.webm" }, wantErr: ErrInvalidInput},
		{name: "not audio", storage: uploaded(), volunteer: voiceContributor(), mutate: func(in *ContributionInput) { in.AudioKey = "data-lab/voice/sw/7/page.webm" }, wantErr: ErrInvalidInput},
		{name: "no voice consent", storage: uploaded(), volunteer: swahiliContributor(), wantErr: ErrVoiceConsentRequired},
		{name: "voice not set up", storage: nil, volunteer: voiceContributor(), wantErr: ErrVoiceUnavailable},
		{name: "unknown modality", storage: uploaded(), volunteer: voiceContributor(), mutate: func(in *ContributionInput) { in.Modality = "video" }, wantErr: ErrInvalidInput},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{volunteer: tt.volunteer, translation: 42}
			if tt.untranslated {
				store.translation = 0
			}
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
			if rec.Modality != domain.ModalityAudio || rec.AudioKey != key || rec.ReadsContributionID != 42 || rec.Text != "" {
				t.Errorf("saved %+v, want the recording at %s reading contribution 42", rec, key)
			}
		})
	}
}

func TestAcceptVoiceConsent_NeedsCurrentConsent(t *testing.T) {
	outdated := swahiliContributor()
	outdated.ConsentVersion = "old"
	tests := []struct {
		name      string
		volunteer *domain.Volunteer
		wantErr   error
	}{
		{name: "current consent", volunteer: swahiliContributor()},
		{name: "not onboarded", volunteer: nil, wantErr: ErrNotOnboarded},
		{name: "outdated consent", volunteer: outdated, wantErr: ErrConsentOutdated},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{volunteer: tt.volunteer}

			_, err := NewDataLab(store, nil, &fakeStorage{}).AcceptVoiceConsent(context.Background(), &FirebaseToken{UID: "uid-7"})

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("AcceptVoiceConsent() error = %v, want %v", err, tt.wantErr)
			}
			if (tt.wantErr == nil) != (store.voiceFor == 7) {
				t.Errorf("voice consent saved for %d", store.voiceFor)
			}
		})
	}
}

func TestNextTask_VoiceNeedsStorageAndConsent(t *testing.T) {
	tests := []struct {
		name      string
		storage   StorageService
		volunteer *domain.Volunteer
		modality  string
		wantErr   error
	}{
		{name: "text by default", storage: nil, volunteer: swahiliContributor(), modality: ""},
		{name: "voice", storage: &fakeStorage{}, volunteer: voiceContributor(), modality: domain.ModalityAudio},
		{name: "voice not set up", storage: nil, volunteer: voiceContributor(), modality: domain.ModalityAudio, wantErr: ErrVoiceUnavailable},
		{name: "voice without consent", storage: &fakeStorage{}, volunteer: swahiliContributor(), modality: domain.ModalityAudio, wantErr: ErrVoiceConsentRequired},
		{name: "unknown modality", storage: &fakeStorage{}, volunteer: voiceContributor(), modality: "video", wantErr: ErrInvalidInput},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := &fakeStore{volunteer: tt.volunteer}

			task, err := NewDataLab(store, nil, tt.storage).NextTask(context.Background(), &FirebaseToken{UID: "uid-7"}, "sw", tt.modality)

			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("NextTask() error = %v, want %v", err, tt.wantErr)
			}
			want := tt.modality
			if want == "" {
				want = domain.ModalityText
			}
			if tt.wantErr == nil && task.Modality != want {
				t.Errorf("task modality = %q, want %q", task.Modality, want)
			}
		})
	}
}
