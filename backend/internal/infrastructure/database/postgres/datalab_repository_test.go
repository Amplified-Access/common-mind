package postgres

import (
	"context"
	"errors"
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

func contribute(t *testing.T, item, contributor int64, status string) {
	t.Helper()
	if _, err := testDB.Exec(`INSERT INTO contributions (item_id, language_code, contributor_id, text, consent_version, status) VALUES ($1, 'sw', $2, 'x', $3, $4)`, item, contributor, domain.CurrentConsentVersion, status); err != nil {
		t.Fatal(err)
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

	task, err := repo.NextItem(ctx, me, "sw")
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
	if task, err := repo.NextItem(ctx, me, "sw"); err != nil || task != nil {
		t.Errorf("NextItem after everything is taken = %+v, %v, want nil, nil", task, err)
	}
}

func TestDataLab_CreateContribution_RejectsRepeatsAndUnknownItems(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabRepository(testDB)
	me := seedVolunteer(t, "uid-me", "sw")
	ids := seedItems(t, "The borehole is broken.")
	rec := usecase.ContributionRecord{ItemID: ids[0], Language: "sw", ContributorID: me, Text: "Kisima kimeharibika.", Pasted: true, ConsentVersion: domain.CurrentConsentVersion}

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

func TestDataLab_Progress_CountsPerLanguage(t *testing.T) {
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
	want := domain.LanguageProgress{Code: "sw", Verified: 1, Pending: 1, Contributors: 2, Reviewers: 1, Open: false}
	if sw[0] != want {
		t.Errorf("sw progress = %+v, want %+v", sw[0], want)
	}
}
