package postgres

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"backend/internal/domain"
	"backend/internal/usecase"
)

func TestDataLab_ListLanguages_TargetsFirstSkipsDisabled(t *testing.T) {
	ctx := context.Background()
	if _, err := testDB.Exec(`UPDATE languages SET enabled = false WHERE code = 'fr'`); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = testDB.Exec(`UPDATE languages SET enabled = true WHERE code = 'fr'`) })

	langs, err := NewDataLabRepository(testDB).ListLanguages(ctx)
	if err != nil {
		t.Fatalf("ListLanguages: %v", err)
	}

	if len(langs) != 10 {
		t.Fatalf("got %d languages, want the 9 targets plus English", len(langs))
	}
	if last := langs[len(langs)-1]; last.Code != "en" {
		t.Errorf("last language = %q, want the source language en", last.Code)
	}
	for _, l := range langs {
		if l.Code == "din" && len(l.ExtraCharacters) != 10 {
			t.Errorf("din extra characters = %v, want 10", l.ExtraCharacters)
		}
	}
}

func TestDataLab_SaveOnboarding_AddsLanguagesWithoutLoweringLevel(t *testing.T) {
	truncate(t, "users")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	rec := usecase.OnboardingRecord{
		FirebaseUID: "uid-amina", Name: "Amina", Email: "amina@example.com",
		Languages: []string{"sw"}, ConsentVersion: domain.CurrentConsentVersion,
	}

	if _, err := repo.SaveOnboarding(ctx, rec); err != nil {
		t.Fatalf("first SaveOnboarding: %v", err)
	}
	if _, err := testDB.Exec(`UPDATE language_members SET level = 'reviewer' WHERE language_code = 'sw'`); err != nil {
		t.Fatal(err)
	}
	rec.Languages = []string{"sw", "luo"}
	if _, err := repo.SaveOnboarding(ctx, rec); err != nil {
		t.Fatalf("second SaveOnboarding: %v", err)
	}

	v, err := repo.GetVolunteer(ctx, "uid-amina")
	if err != nil || v == nil {
		t.Fatalf("GetVolunteer = %v, %v", v, err)
	}
	if !v.ConsentCurrent() {
		t.Errorf("consent version = %q, want current", v.ConsentVersion)
	}
	if sw, _ := v.Membership("sw"); sw.Level != domain.LevelReviewer {
		t.Errorf("sw level = %q, want reviewer kept", sw.Level)
	}
	if luo, ok := v.Membership("luo"); !ok || luo.Level != domain.LevelContributor {
		t.Errorf("luo membership = %+v, %v, want contributor", luo, ok)
	}

	if missing, err := repo.GetVolunteer(ctx, "uid-nobody"); err != nil || missing != nil {
		t.Errorf("GetVolunteer(unknown) = %v, %v, want nil, nil", missing, err)
	}
}

// seedVolunteer onboards a volunteer in the given languages and returns their ID.
func seedVolunteer(t *testing.T, uid string, langs ...string) int64 {
	t.Helper()
	v, err := NewDataLabRepository(testDB).SaveOnboarding(context.Background(), usecase.OnboardingRecord{
		FirebaseUID: uid, Name: uid, Languages: langs, ConsentVersion: domain.CurrentConsentVersion,
	})
	if err != nil {
		t.Fatalf("seed volunteer %s: %v", uid, err)
	}
	return v.ID
}

// seedItems adds one source with the given English segments and returns their IDs.
func seedItems(t *testing.T, texts ...string) []int64 {
	t.Helper()
	var sourceID int64
	if err := testDB.QueryRow(`INSERT INTO sources (key, title, licence, split) VALUES ('src-1', 'Test', 'CC-BY-4.0', 'train') RETURNING id`).Scan(&sourceID); err != nil {
		t.Fatal(err)
	}
	var ids []int64
	for _, text := range texts {
		var id int64
		if err := testDB.QueryRow(`INSERT INTO items (source_id, kind, language_code, category, text) VALUES ($1, 'translate', 'en', 'public-services', $2) RETURNING id`, sourceID, text).Scan(&id); err != nil {
			t.Fatal(err)
		}
		ids = append(ids, id)
	}
	return ids
}

func contribute(t *testing.T, item, contributor int64, status string) int64 {
	t.Helper()
	var id int64
	if err := testDB.QueryRow(`INSERT INTO contributions (item_id, language_code, contributor_id, text, consent_version, status) VALUES ($1, 'sw', $2, 'x', $3, $4) RETURNING id`, item, contributor, domain.CurrentConsentVersion, status).Scan(&id); err != nil {
		t.Fatal(err)
	}
	return id
}

// record adds a recording in sw reading the written contribution `reads`.
func record(t *testing.T, item, contributor, reads int64, status string) {
	t.Helper()
	key := fmt.Sprintf("data-lab/voice/sw/%d/%d.webm", contributor, item)
	if _, err := testDB.Exec(`INSERT INTO contributions (item_id, language_code, contributor_id, text, modality, audio_key, reads_contribution_id, consent_version, status) VALUES ($1, 'sw', $2, '', 'audio', $3, $4, $5, $6)`, item, contributor, key, reads, domain.CurrentConsentVersion, status); err != nil {
		t.Fatal(err)
	}
}

func TestDataLab_Voice_ReadsVerifiedTranslations(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	me := seedVolunteer(t, "uid-me", "sw")
	other := seedVolunteer(t, "uid-other", "sw")
	ids := seedItems(t, "verified", "in review", "recorded already", "untranslated")
	verified := contribute(t, ids[0], other, domain.StatusVerified)
	// A reviewer's correction is the verified text, so it's what gets read.
	if _, err := testDB.Exec(`INSERT INTO reviews (contribution_id, reviewer_id, decision, corrected_text) VALUES ($1, $2, 'correct', 'Imesahihishwa.')`, verified, me); err != nil {
		t.Fatal(err)
	}
	contribute(t, ids[1], other, domain.StatusPending)
	recorded := contribute(t, ids[2], other, domain.StatusVerified)
	record(t, ids[2], other, recorded, domain.StatusPending)

	// Only a verified translation not yet recorded is offered, in its own words.
	task, err := repo.NextItem(ctx, me, "sw", domain.ModalityAudio)
	if err != nil || task == nil {
		t.Fatalf("NextItem(audio) = %+v, %v", task, err)
	}
	if task.ItemID != ids[0] || task.Text != "Imesahihishwa." || task.TextLanguage != "sw" {
		t.Errorf("voice task = %+v, want item %d's corrected translation, in sw", task, ids[0])
	}

	if got, err := repo.VerifiedTranslation(ctx, ids[0], "sw"); err != nil || got != verified {
		t.Errorf("VerifiedTranslation(verified) = %d, %v, want %d", got, err, verified)
	}
	if got, err := repo.VerifiedTranslation(ctx, ids[1], "sw"); err != nil || got != 0 {
		t.Errorf("VerifiedTranslation(in review) = %d, %v, want 0", got, err)
	}

	// A volunteer records a translation once.
	voice := usecase.ContributionRecord{ItemID: ids[0], Language: "sw", ContributorID: me, Modality: domain.ModalityAudio, AudioKey: "data-lab/voice/sw/1/a.webm", ReadsContributionID: verified, ConsentVersion: domain.CurrentConsentVersion}
	got, err := repo.CreateContribution(ctx, voice)
	if err != nil {
		t.Fatalf("voice contribution: %v", err)
	}
	if got.Modality != domain.ModalityAudio || got.Text != "" {
		t.Errorf("voice contribution = %+v, want audio", got)
	}
	voice.AudioKey = "data-lab/voice/sw/1/b.webm"
	if _, err := repo.CreateContribution(ctx, voice); !errors.Is(err, usecase.ErrAlreadyContributed) {
		t.Errorf("second recording error = %v, want ErrAlreadyContributed", err)
	}
	if task, err := repo.NextItem(ctx, other, "sw", domain.ModalityAudio); err != nil || task != nil {
		t.Errorf("NextItem(audio) once both are recorded = %+v, %v, want nil, nil", task, err)
	}

	// Reviewers hear the recording against the text it reads. Everything else
	// pending is the reviewer's own, so the recording is next.
	pending, err := repo.NextPendingContribution(ctx, other, "sw")
	if err != nil || pending == nil || pending.ContributionID != got.ID {
		t.Fatalf("NextPendingContribution = %+v, %v, want the recording", pending, err)
	}
	if pending.Modality != domain.ModalityAudio || pending.AudioKey != "data-lab/voice/sw/1/a.webm" || pending.ReadText != "Imesahihishwa." {
		t.Errorf("pending = %+v, want the recording with its key and the text it reads", pending)
	}
	if ref, err := repo.GetContributionRef(ctx, pending.ContributionID); err != nil || ref.Modality != domain.ModalityAudio {
		t.Errorf("GetContributionRef = %+v, %v, want an audio contribution", ref, err)
	}
}

func TestDataLab_SaveVoiceConsent_CoversVoice(t *testing.T) {
	truncate(t, "users")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	id := seedVolunteer(t, "uid-me", "sw")
	if v, _ := repo.GetVolunteer(ctx, "uid-me"); v.VoiceConsent {
		t.Fatal("voice consent before accepting it")
	}

	if err := repo.SaveVoiceConsent(ctx, id, domain.CurrentConsentVersion); err != nil {
		t.Fatalf("SaveVoiceConsent: %v", err)
	}
	if v, _ := repo.GetVolunteer(ctx, "uid-me"); !v.VoiceConsent {
		t.Error("no voice consent after accepting it")
	}
}

func TestDataLab_NextItem_SkipsTakenAndOwnItems(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	me := seedVolunteer(t, "uid-me", "sw")
	other := seedVolunteer(t, "uid-other", "sw")
	ids := seedItems(t, "pending elsewhere", "verified elsewhere", "rejected for someone else", "rejected for me")
	contribute(t, ids[0], other, domain.StatusPending)
	contribute(t, ids[1], other, domain.StatusVerified)
	contribute(t, ids[2], other, domain.StatusRejected)
	contribute(t, ids[3], me, domain.StatusRejected)

	task, err := repo.NextItem(ctx, me, "sw", domain.ModalityText)
	if err != nil {
		t.Fatalf("NextItem: %v", err)
	}
	if task == nil || task.ItemID != ids[2] {
		t.Fatalf("NextItem = %+v, want item %d (rejected for someone else, reopened)", task, ids[2])
	}
	if task.TargetLanguage != "sw" || task.TextLanguage != "en" {
		t.Errorf("languages = %s → %s, want en → sw", task.TextLanguage, task.TargetLanguage)
	}

	contribute(t, ids[2], me, domain.StatusPending)
	if task, err := repo.NextItem(ctx, me, "sw", domain.ModalityText); err != nil || task != nil {
		t.Errorf("NextItem after everything is taken = %+v, %v, want nil, nil", task, err)
	}
}

func TestDataLab_CreateContribution_RejectsRepeatsAndUnknownItems(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	me := seedVolunteer(t, "uid-me", "sw")
	ids := seedItems(t, "The borehole is broken.")
	rec := usecase.ContributionRecord{ItemID: ids[0], Language: "sw", ContributorID: me, Modality: domain.ModalityText, Text: "Kisima kimeharibika.", Pasted: true, ConsentVersion: domain.CurrentConsentVersion}

	got, err := repo.CreateContribution(ctx, rec)
	if err != nil {
		t.Fatalf("CreateContribution: %v", err)
	}
	if got.Status != domain.StatusPending || !got.Pasted {
		t.Errorf("created = %+v, want pending and pasted", got)
	}

	if _, err := repo.CreateContribution(ctx, rec); !errors.Is(err, usecase.ErrAlreadyContributed) {
		t.Errorf("repeat error = %v, want ErrAlreadyContributed", err)
	}
	rec.ItemID = 999999
	if _, err := repo.CreateContribution(ctx, rec); !errors.Is(err, usecase.ErrNotFound) {
		t.Errorf("unknown item error = %v, want ErrNotFound", err)
	}
}

func TestDataLab_CountReviewers_CountsReviewersAndLeads(t *testing.T) {
	truncate(t, "users")
	a := seedVolunteer(t, "uid-a", "sw")
	b := seedVolunteer(t, "uid-b", "sw")
	seedVolunteer(t, "uid-c", "sw")
	if _, err := testDB.Exec(`UPDATE language_members SET level = CASE user_id WHEN $1 THEN 'reviewer' ELSE 'lead' END WHERE user_id IN ($1, $2)`, a, b); err != nil {
		t.Fatal(err)
	}

	n, err := NewDataLabRepository(testDB).CountReviewers(context.Background(), "sw")
	if err != nil || n != 2 {
		t.Errorf("CountReviewers = %d, %v, want 2", n, err)
	}
}

func TestDataLab_NextPendingContribution_OldestNotOwn(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	reviewer := seedVolunteer(t, "uid-reviewer", "sw")
	other := seedVolunteer(t, "uid-other", "sw")
	ids := seedItems(t, "own", "verified", "oldest pending", "newer pending")
	contribute(t, ids[0], reviewer, domain.StatusPending)
	contribute(t, ids[1], other, domain.StatusVerified)
	contribute(t, ids[2], other, domain.StatusPending)
	contribute(t, ids[3], other, domain.StatusPending)

	got, err := repo.NextPendingContribution(ctx, reviewer, "sw")
	if err != nil {
		t.Fatalf("NextPendingContribution: %v", err)
	}
	if got == nil || got.ItemText != "oldest pending" {
		t.Fatalf("got %+v, want the oldest pending contribution by someone else", got)
	}
	if missing, err := repo.NextPendingContribution(ctx, reviewer, "luo"); err != nil || missing != nil {
		t.Errorf("other language = %+v, %v, want nil, nil", missing, err)
	}
}

func TestDataLab_SaveReview_SetsStatusOnce(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	reviewer := seedVolunteer(t, "uid-reviewer", "sw")
	other := seedVolunteer(t, "uid-other", "sw")
	ids := seedItems(t, "The clinic opens at eight.")
	contribute(t, ids[0], other, domain.StatusPending)
	ref, err := repo.GetContributionRef(ctx, 1)
	if err != nil {
		t.Fatalf("GetContributionRef: %v", err)
	}

	rec := usecase.ReviewRecord{ContributionID: ref.ID, ReviewerID: reviewer, Decision: domain.DecisionReject, Reason: "inaccurate", Status: domain.StatusRejected}
	if err := repo.SaveReview(ctx, rec); err != nil {
		t.Fatalf("SaveReview: %v", err)
	}
	if after, _ := repo.GetContributionRef(ctx, ref.ID); after.Status != domain.StatusRejected {
		t.Errorf("status = %q, want rejected", after.Status)
	}

	rec.Decision, rec.Reason, rec.Status = domain.DecisionAccept, "", domain.StatusVerified
	if err := repo.SaveReview(ctx, rec); !errors.Is(err, usecase.ErrAlreadyReviewed) {
		t.Errorf("second review error = %v, want ErrAlreadyReviewed", err)
	}
	if _, err := repo.GetContributionRef(ctx, 999999); !errors.Is(err, usecase.ErrNotFound) {
		t.Errorf("unknown contribution error = %v, want ErrNotFound", err)
	}
}

func TestDataLab_Progress_CountsSentencePairsPerLanguage(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	a := seedVolunteer(t, "uid-a", "sw")
	b := seedVolunteer(t, "uid-b", "sw", "luo")
	if _, err := testDB.Exec(`UPDATE language_members SET level = 'lead' WHERE user_id = $1 AND language_code = 'sw'`, b); err != nil {
		t.Fatal(err)
	}
	ids := seedItems(t, "one", "two", "three")
	contribute(t, ids[0], a, domain.StatusVerified)
	contribute(t, ids[1], a, domain.StatusPending)
	contribute(t, ids[2], a, domain.StatusRejected)
	// An answer to a write prompt is original text, not a pair with English.
	var prompt int64
	if err := testDB.QueryRow(`INSERT INTO items (source_id, kind, language_code, category, text) SELECT source_id, 'write', 'en', 'elections', 'prompt' FROM items WHERE id = $1 RETURNING id`, ids[0]).Scan(&prompt); err != nil {
		t.Fatal(err)
	}
	contribute(t, prompt, a, domain.StatusVerified)
	// Recordings count apart from the written pairs.
	var read int64
	if err := testDB.QueryRow(`SELECT id FROM contributions WHERE item_id = $1`, ids[0]).Scan(&read); err != nil {
		t.Fatal(err)
	}
	record(t, ids[0], a, read, domain.StatusVerified)
	record(t, ids[1], b, read, domain.StatusPending)

	all, err := NewDataLabRepository(testDB).Progress(ctx, "")
	if err != nil {
		t.Fatalf("Progress: %v", err)
	}
	if len(all) != 9 {
		t.Fatalf("got %d languages, want the 9 targets", len(all))
	}
	sw, err := NewDataLabRepository(testDB).Progress(ctx, "sw")
	if err != nil || len(sw) != 1 {
		t.Fatalf("Progress(sw) = %v, %v", sw, err)
	}
	want := domain.LanguageProgress{Code: "sw", Available: 3, Translated: 2, Verified: 1, Recorded: 2, RecordedVerified: 1, Pending: 2, Reviewers: 1, Open: false}
	if sw[0] != want {
		t.Errorf("sw progress = %+v, want %+v", sw[0], want)
	}
}

func TestDataLab_ImportItems_IsIdempotentAndKeepsSplit(t *testing.T) {
	truncate(t, "sources")
	ctx := context.Background()
	repo := NewImportRepository(testDB)
	src := usecase.ImportSource{Key: "council-notices-2026", Title: "Council notices", Licence: "CC-BY-4.0"}
	rows := []usecase.ImportRow{
		{Source: src, Kind: domain.KindTranslate, Language: "en", Category: "public-services", Text: "The clinic opens at eight."},
		{Source: src, Kind: domain.KindWrite, Language: "en", Category: "elections", Text: "How do you find your polling station?"},
	}

	first, err := repo.ImportItems(ctx, rows)
	if err != nil {
		t.Fatalf("first import: %v", err)
	}
	if first != (usecase.ImportResult{Sources: 1, Items: 2}) {
		t.Errorf("first import = %+v, want 1 source and 2 items", first)
	}

	again, err := repo.ImportItems(ctx, rows)
	if err != nil {
		t.Fatalf("second import: %v", err)
	}
	if again != (usecase.ImportResult{Skipped: 2}) {
		t.Errorf("second import = %+v, want everything skipped", again)
	}

	var split string
	if err := testDB.QueryRow(`SELECT split FROM sources WHERE key = $1`, src.Key).Scan(&split); err != nil {
		t.Fatal(err)
	}
	if split != domain.SplitFor(src.Key) {
		t.Errorf("split = %q, want %q", split, domain.SplitFor(src.Key))
	}
}

func TestDataLab_SetMemberLevel_NeedsMembership(t *testing.T) {
	truncate(t, "users")
	ctx := context.Background()
	repo := NewImportRepository(testDB)
	if _, err := NewDataLabRepository(testDB).SaveOnboarding(ctx, usecase.OnboardingRecord{
		FirebaseUID: "uid-baraka", Name: "Baraka", Email: "baraka@example.com", Languages: []string{"sw"}, ConsentVersion: domain.CurrentConsentVersion,
	}); err != nil {
		t.Fatal(err)
	}

	if err := repo.SetMemberLevel(ctx, "baraka@example.com", "sw", domain.LevelReviewer); err != nil {
		t.Fatalf("SetMemberLevel: %v", err)
	}
	v, _ := NewDataLabRepository(testDB).GetVolunteer(ctx, "uid-baraka")
	if m, _ := v.Membership("sw"); m.Level != domain.LevelReviewer {
		t.Errorf("sw level = %q, want reviewer", m.Level)
	}
	if err := repo.SetMemberLevel(ctx, "baraka@example.com", "luo", domain.LevelReviewer); !errors.Is(err, usecase.ErrNotFound) {
		t.Errorf("non-member error = %v, want ErrNotFound", err)
	}
}

func TestDataLab_SaveReview_StoresCorrectionBesideTheOriginal(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	reviewer := seedVolunteer(t, "uid-reviewer", "sw")
	other := seedVolunteer(t, "uid-other", "sw")
	ids := seedItems(t, "The clinic opens at eight.")
	contribute(t, ids[0], other, domain.StatusPending)
	ref, err := repo.GetContributionRef(ctx, 1)
	if err != nil || ref.Text != "x" {
		t.Fatalf("GetContributionRef = %+v, %v, want the contribution's text", ref, err)
	}

	rec := usecase.ReviewRecord{ContributionID: ref.ID, ReviewerID: reviewer, Decision: domain.DecisionCorrect, CorrectedText: "Kliniki hufunguliwa saa mbili.", Status: domain.StatusVerified}
	if err := repo.SaveReview(ctx, rec); err != nil {
		t.Fatalf("SaveReview: %v", err)
	}

	var original, corrected, status string
	if err := testDB.QueryRow(`SELECT c.text, r.corrected_text, c.status FROM contributions c JOIN reviews r ON r.contribution_id = c.id WHERE c.id = $1`, ref.ID).Scan(&original, &corrected, &status); err != nil {
		t.Fatal(err)
	}
	if original != "x" || corrected != rec.CorrectedText || status != domain.StatusVerified {
		t.Errorf("got original %q, corrected %q, status %q; want the original kept, the correction stored, verified", original, corrected, status)
	}
}
