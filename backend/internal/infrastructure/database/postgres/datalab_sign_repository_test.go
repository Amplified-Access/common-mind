package postgres

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain"
	"backend/internal/usecase"
)

// seedKinds adds one source with one English item of each kind given and
// returns their IDs, in order.
func seedKinds(t *testing.T, kinds ...string) []int64 {
	t.Helper()
	var sourceID int64
	if err := testDB.QueryRow(`INSERT INTO sources (key, title, licence, split) VALUES ('src-kinds', 'Test', 'CC-BY-4.0', 'train') RETURNING id`).Scan(&sourceID); err != nil {
		t.Fatal(err)
	}
	var ids []int64
	for i, kind := range kinds {
		var id int64
		if err := testDB.QueryRow(`INSERT INTO items (source_id, kind, language_code, category, text) VALUES ($1, $2, 'en', 'public-services', $3) RETURNING id`,
			sourceID, kind, kind+string(rune('a'+i))).Scan(&id); err != nil {
			t.Fatal(err)
		}
		ids = append(ids, id)
	}
	return ids
}

func TestDataLab_Sign_WordsComeBeforeSentencesAndStayOutOfWriting(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	me := seedVolunteer(t, "uid-me", "ugn", "sw")
	other := seedVolunteer(t, "uid-other", "ugn")
	ids := seedKinds(t, domain.KindTranslate, domain.KindWord, domain.KindWrite)
	sentence, word := ids[0], ids[1]

	// The word comes first, whatever the random order.
	for range 5 {
		task, err := repo.NextItem(ctx, me, "ugn", domain.ModalityVideo)
		if err != nil || task == nil || task.ItemID != word {
			t.Fatalf("NextItem(video) = %+v, %v, want the word %d", task, err, word)
		}
		if task.Kind != domain.KindWord || task.TextLanguage != "en" || task.Modality != domain.ModalityVideo {
			t.Errorf("sign task = %+v, want the English word to sign", task)
		}
	}

	// Once the word is signed, the sentence follows; a write prompt never does.
	sign := usecase.ContributionRecord{ItemID: word, Language: "ugn", ContributorID: other, Modality: domain.ModalityVideo,
		VideoKey: "data-lab/sign/ugn/2/a.webm", LandmarksKey: "data-lab/sign/ugn/2/a.landmarks.json", ConsentVersion: domain.CurrentConsentVersion}
	if _, err := repo.CreateContribution(ctx, sign); err != nil {
		t.Fatalf("sign contribution: %v", err)
	}
	task, err := repo.NextItem(ctx, me, "ugn", domain.ModalityVideo)
	if err != nil || task == nil || task.ItemID != sentence {
		t.Fatalf("NextItem(video) after the word = %+v, %v, want the sentence %d", task, err, sentence)
	}
	contribute(t, sentence, other, domain.StatusPending) // a written sw contribution doesn't close it in ugn
	if task, err := repo.NextItem(ctx, me, "ugn", domain.ModalityVideo); err != nil || task == nil || task.ItemID != sentence {
		t.Errorf("NextItem(video) = %+v, %v, want the sentence, still open in ugn", task, err)
	}

	// Writers in spoken languages never get words to sign.
	for range 5 {
		task, err := repo.NextItem(ctx, me, "sw", domain.ModalityText)
		if err != nil {
			t.Fatalf("NextItem(text): %v", err)
		}
		if task != nil && task.ItemID == word {
			t.Fatalf("NextItem(text) offered the word %d", word)
		}
	}
}

func TestDataLab_Sign_ReachesReviewWithItsFilesAndCountsAsSigned(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	signer := seedVolunteer(t, "uid-signer", "ugn")
	reviewer := seedVolunteer(t, "uid-reviewer", "ugn")
	ids := seedKinds(t, domain.KindWord, domain.KindWord, domain.KindTranslate, domain.KindWrite)

	sign := usecase.ContributionRecord{ItemID: ids[0], Language: "ugn", ContributorID: signer, Modality: domain.ModalityVideo,
		VideoKey: "data-lab/sign/ugn/1/a.webm", LandmarksKey: "data-lab/sign/ugn/1/a.landmarks.json", ConsentVersion: domain.CurrentConsentVersion}
	got, err := repo.CreateContribution(ctx, sign)
	if err != nil {
		t.Fatalf("sign contribution: %v", err)
	}
	if got.Modality != domain.ModalityVideo || got.Text != "" {
		t.Errorf("sign contribution = %+v, want video without text", got)
	}
	sign.VideoKey, sign.LandmarksKey = "data-lab/sign/ugn/1/b.webm", ""
	if _, err := repo.CreateContribution(ctx, sign); !errors.Is(err, usecase.ErrAlreadyContributed) {
		t.Errorf("second take of the same word error = %v, want ErrAlreadyContributed", err)
	}
	// A take without landmarks is still a sign.
	sign.ItemID = ids[1]
	if _, err := repo.CreateContribution(ctx, sign); err != nil {
		t.Fatalf("sign without landmarks: %v", err)
	}

	pending, err := repo.NextPendingContribution(ctx, reviewer, "ugn")
	if err != nil || pending == nil || pending.ContributionID != got.ID {
		t.Fatalf("NextPendingContribution = %+v, %v, want the first sign", pending, err)
	}
	if pending.Modality != domain.ModalityVideo || pending.VideoKey != "data-lab/sign/ugn/1/a.webm" ||
		pending.LandmarksKey != "data-lab/sign/ugn/1/a.landmarks.json" || pending.Kind != domain.KindWord {
		t.Errorf("pending = %+v, want the word's video and landmarks", pending)
	}
	if err := repo.SaveReview(ctx, usecase.ReviewRecord{ContributionID: got.ID, ReviewerID: reviewer, Decision: domain.DecisionAccept, Status: domain.StatusVerified}); err != nil {
		t.Fatalf("SaveReview: %v", err)
	}

	p, err := repo.Progress(ctx, "ugn")
	if err != nil || len(p) != 1 {
		t.Fatalf("Progress(ugn) = %v, %v", p, err)
	}
	// Words and sentences are both there to sign; write prompts aren't.
	want := domain.LanguageProgress{Code: "ugn", Available: 3, Signed: 2, SignedVerified: 1, Pending: 1}
	if p[0] != want {
		t.Errorf("Progress(ugn) = %+v, want %+v", p[0], want)
	}
	// Spoken languages count sentences only.
	if sw, _ := repo.Progress(ctx, "sw"); len(sw) != 1 || sw[0].Available != 1 || sw[0].Signed != 0 {
		t.Errorf("Progress(sw) = %+v, want one sentence and no signs", sw)
	}
}

func TestDataLab_SaveVideoConsent_CoversVideoOnly(t *testing.T) {
	truncate(t, "users")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	id := seedVolunteer(t, "uid-me", "ugn")
	if v, _ := repo.GetVolunteer(ctx, "uid-me"); v.VideoConsent {
		t.Fatal("video consent before accepting it")
	}

	if err := repo.SaveVideoConsent(ctx, id, domain.CurrentConsentVersion); err != nil {
		t.Fatalf("SaveVideoConsent: %v", err)
	}
	v, _ := repo.GetVolunteer(ctx, "uid-me")
	if !v.VideoConsent || v.VoiceConsent {
		t.Errorf("after accepting video: video %v, voice %v, want video only", v.VideoConsent, v.VoiceConsent)
	}
}
