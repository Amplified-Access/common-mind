package postgres

import (
	"context"
	"errors"
	"testing"

	"backend/internal/domain"
	"backend/internal/usecase"
)

// write adds a written contribution and returns its ID.
func write(t *testing.T, item, contributor int64, language, text, status string) int64 {
	t.Helper()
	var id int64
	if err := testDB.QueryRow(`INSERT INTO contributions (item_id, language_code, contributor_id, text, consent_version, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		item, language, contributor, text, domain.CurrentConsentVersion, status).Scan(&id); err != nil {
		t.Fatal(err)
	}
	return id
}

func review(t *testing.T, contribution, reviewer int64, decision, reason, corrected string) {
	t.Helper()
	var reasonArg, correctedArg any
	if reason != "" {
		reasonArg = reason
	}
	if corrected != "" {
		correctedArg = corrected
	}
	if _, err := testDB.Exec(`INSERT INTO reviews (contribution_id, reviewer_id, decision, reason, corrected_text) VALUES ($1, $2, $3, $4, $5)`,
		contribution, reviewer, decision, reasonArg, correctedArg); err != nil {
		t.Fatal(err)
	}
}

func TestDataLabAdmin_ListTranslators_CountsEachVolunteersWork(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabAdminRepository(testDB)
	amina := seedVolunteer(t, "amina", "sw")
	baraka := seedVolunteer(t, "baraka", "sw", "luo")
	idle := seedVolunteer(t, "idle", "luo")
	ids := seedItems(t, "one", "two", "three", "four")

	verified := write(t, ids[0], amina, "sw", "moja", domain.StatusVerified)
	review(t, verified, baraka, domain.DecisionAccept, "", "")
	corrected := write(t, ids[1], amina, "sw", "mbili", domain.StatusVerified)
	review(t, corrected, baraka, domain.DecisionCorrect, "", "Mbili.")
	rejected := write(t, ids[2], amina, "sw", "tatu", domain.StatusRejected)
	review(t, rejected, baraka, domain.DecisionReject, "inaccurate", "")
	write(t, ids[3], amina, "sw", "nne", domain.StatusPending)
	record(t, ids[0], amina, verified, domain.StatusPending)
	write(t, ids[0], baraka, "luo", "achiel", domain.StatusPending)

	all, err := repo.ListTranslators(ctx, usecase.TranslatorFilter{})
	if err != nil {
		t.Fatalf("ListTranslators: %v", err)
	}
	if len(all) != 3 {
		t.Fatalf("got %d translators, want 3 (a member with no work too)", len(all))
	}
	a := all[0]
	if a.ID != amina {
		t.Fatalf("first translator = %d, want the one with most contributions (%d)", a.ID, amina)
	}
	want := domain.Translator{Written: 4, Recorded: 1, Pending: 2, Verified: 2, Corrected: 1, Rejected: 1}
	if a.Written != want.Written || a.Recorded != want.Recorded || a.Pending != want.Pending ||
		a.Verified != want.Verified || a.Corrected != want.Corrected || a.Rejected != want.Rejected {
		t.Errorf("amina's counts = %+v, want %+v", a, want)
	}
	if a.LastActiveAt == nil || len(a.Languages) != 1 || a.Languages[0].LanguageCode != "sw" || a.Languages[0].Contributions != 5 {
		t.Errorf("amina = %+v, want last active set and her 5 contributions in sw", a)
	}
	b := all[1]
	if b.ID != baraka || b.Reviewed != 3 || b.Written != 1 {
		t.Errorf("baraka = %+v, want 3 reviews and 1 written", b)
	}
	// Each language carries their contributions in it, busiest first; a
	// language they joined but haven't worked in shows 0.
	if got := b.Languages; len(got) != 2 || got[0].LanguageCode != "luo" || got[0].Contributions != 1 ||
		got[1].LanguageCode != "sw" || got[1].Contributions != 0 || got[1].Level != domain.LevelContributor {
		t.Errorf("baraka's languages = %+v, want luo 1, then sw 0", got)
	}
	if last := all[2]; last.ID != idle || last.Written != 0 || last.LastActiveAt != nil {
		t.Errorf("idle = %+v, want no work and never active", last)
	}

	// A language narrows it to that language's people and work.
	luo, err := repo.ListTranslators(ctx, usecase.TranslatorFilter{Language: "luo"})
	if err != nil {
		t.Fatalf("ListTranslators(luo): %v", err)
	}
	if len(luo) != 2 || luo[0].ID != baraka || luo[0].Written != 1 || luo[0].Reviewed != 0 {
		t.Errorf("luo = %+v, want baraka (1 written, no luo reviews) then idle", luo)
	}

	one, err := repo.ListTranslators(ctx, usecase.TranslatorFilter{ID: amina})
	if err != nil || len(one) != 1 || one[0].ID != amina {
		t.Errorf("ListTranslators(ID) = %+v, %v, want amina alone", one, err)
	}
}

func TestDataLabAdmin_ListContributions_PairsItemWithTranslationAndReview(t *testing.T) {
	truncate(t, "users", "sources")
	ctx := context.Background()
	repo := NewDataLabAdminRepository(testDB)
	amina := seedVolunteer(t, "amina", "sw")
	baraka := seedVolunteer(t, "baraka", "sw")
	ids := seedItems(t, "The clinic opens at eight.", "Vote on Sunday.", "Bring your card.")

	corrected := write(t, ids[0], amina, "sw", "Kliniki inafunguliwa saa nane.", domain.StatusVerified)
	review(t, corrected, baraka, domain.DecisionCorrect, "", "Kliniki hufunguliwa saa mbili.")
	write(t, ids[1], amina, "sw", "Piga kura Jumapili.", domain.StatusPending)
	write(t, ids[2], baraka, "sw", "Leta kadi yako.", domain.StatusPending)
	record(t, ids[0], baraka, corrected, domain.StatusPending)

	page, err := repo.ListContributions(ctx, usecase.ContributionFilter{ContributorID: amina, Limit: 10})
	if err != nil {
		t.Fatalf("ListContributions: %v", err)
	}
	if page.Total != 2 || len(page.Contributions) != 2 {
		t.Fatalf("got total %d, %d rows, want amina's 2", page.Total, len(page.Contributions))
	}
	pending, verified := page.Contributions[0], page.Contributions[1]
	if pending.ItemText != "Vote on Sunday." || pending.Text != "Piga kura Jumapili." || pending.Review != nil {
		t.Errorf("newest = %+v, want the pending one with no review", pending)
	}
	if verified.ItemText != "The clinic opens at eight." || verified.ItemLanguage != "en" ||
		verified.ContributorName != "amina" || verified.SourceTitle != "Test" {
		t.Errorf("older = %+v, want the item and source beside it", verified)
	}
	if r := verified.Review; r == nil || r.Decision != domain.DecisionCorrect ||
		r.CorrectedText != "Kliniki hufunguliwa saa mbili." || r.ReviewerName != "baraka" {
		t.Errorf("review = %+v, want baraka's correction", verified.Review)
	}

	// A recording reads the verified text: the correction.
	audio, err := repo.ListContributions(ctx, usecase.ContributionFilter{Modality: domain.ModalityAudio, Limit: 10})
	if err != nil || len(audio.Contributions) != 1 {
		t.Fatalf("audio = %+v, %v, want one recording", audio, err)
	}
	if rec := audio.Contributions[0]; rec.ReadText != "Kliniki hufunguliwa saa mbili." || rec.AudioKey == "" {
		t.Errorf("recording = %+v, want it to read the corrected text", rec)
	}

	// Filters and paging: the total counts every match, the page holds the limit.
	paged, err := repo.ListContributions(ctx, usecase.ContributionFilter{Language: "sw", Status: domain.StatusPending, Limit: 2, Offset: 2})
	if err != nil {
		t.Fatalf("ListContributions(paged): %v", err)
	}
	if paged.Total != 3 || len(paged.Contributions) != 1 {
		t.Errorf("paged = total %d, %d rows, want 3 pending in all and 1 left on the second page", paged.Total, len(paged.Contributions))
	}
}

func TestDataLabAdmin_SetMemberLevel_ChangesOnlyThatMembership(t *testing.T) {
	truncate(t, "users")
	ctx := context.Background()
	repo := NewDataLabAdminRepository(testDB)
	amina := seedVolunteer(t, "amina", "ugn", "sw")

	if err := repo.SetMemberLevel(ctx, amina, "ugn", domain.LevelReviewer); err != nil {
		t.Fatalf("SetMemberLevel: %v", err)
	}
	v, _ := NewDataLabRepository(testDB).GetVolunteer(ctx, "amina")
	if m, _ := v.Membership("ugn"); m.Level != domain.LevelReviewer {
		t.Errorf("ugn level = %q, want reviewer", m.Level)
	}
	if m, _ := v.Membership("sw"); m.Level != domain.LevelContributor {
		t.Errorf("sw level = %q, want contributor, untouched", m.Level)
	}
	if err := repo.SetMemberLevel(ctx, amina, "luo", domain.LevelReviewer); !errors.Is(err, usecase.ErrNotFound) {
		t.Errorf("non-member error = %v, want ErrNotFound", err)
	}
	if err := repo.SetMemberLevel(ctx, amina+100, "ugn", domain.LevelReviewer); !errors.Is(err, usecase.ErrNotFound) {
		t.Errorf("unknown volunteer error = %v, want ErrNotFound", err)
	}
}
