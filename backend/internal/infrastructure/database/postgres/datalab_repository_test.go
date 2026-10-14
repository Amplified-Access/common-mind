package postgres

import (
	"context"
	"testing"
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
