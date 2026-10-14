package postgres

import (
	"context"
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
