// Command datalab runs Data Lab admin tasks against the database configured
// by the BLUEPRINT_DB_* environment variables (loaded from .env).
//
//	datalab import <file.jsonl>                  add sources and items
//	datalab promote <email> <language> <level>   set a volunteer's level
package main

import (
	"bufio"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"

	_ "github.com/joho/godotenv/autoload"

	"backend/internal/infrastructure/database/postgres"
	"backend/internal/usecase"
)

const usage = `usage:
  datalab import <file.jsonl>
  datalab promote <email> <language> <contributor|reviewer|lead>`

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(args []string) error {
	if len(args) == 0 {
		return fmt.Errorf("%s", usage)
	}

	db, err := postgres.NewPostgresDB(postgres.DBConfig{
		Host:     os.Getenv("BLUEPRINT_DB_HOST"),
		Port:     os.Getenv("BLUEPRINT_DB_PORT"),
		Database: os.Getenv("BLUEPRINT_DB_DATABASE"),
		Username: os.Getenv("BLUEPRINT_DB_USERNAME"),
		Password: os.Getenv("BLUEPRINT_DB_PASSWORD"),
		Schema:   envOr("BLUEPRINT_DB_SCHEMA", "public"),
		SSLMode:  envOr("BLUEPRINT_DB_SSLMODE", "disable"),
	})
	if err != nil {
		return err
	}
	defer db.Close()

	ctx := context.Background()
	admin := usecase.NewImporter(postgres.NewImportRepository(db), postgres.NewDataLabRepository(db))

	switch {
	case args[0] == "import" && len(args) == 2:
		path := args[1]
		rows, err := readRows(path)
		if err != nil {
			return err
		}
		hash, err := fileHash(path)
		if err != nil {
			return err
		}
		batch := usecase.ImportBatch{FileName: filepath.Base(path), FileHash: hash, ImportedBy: os.Getenv("USER")}
		res, err := admin.ImportItems(ctx, batch, rows)
		if err != nil {
			return err
		}
		fmt.Printf("imported %d new sources and %d new items (batch %d); %d items were already there\n", res.Sources, res.Items, res.BatchID, res.Skipped)
		return nil
	case args[0] == "promote" && len(args) == 4:
		err := admin.SetMemberLevel(ctx, args[1], args[2], args[3])
		if errors.Is(err, usecase.ErrNotFound) {
			return fmt.Errorf("%s has not joined %s in the Data Lab; they add it during onboarding", args[1], args[2])
		}
		if err != nil {
			return fmt.Errorf("promote %s in %s: %w", args[1], args[2], err)
		}
		fmt.Printf("%s is now %s in %s\n", args[1], args[3], args[2])
		return nil
	default:
		return fmt.Errorf("%s", usage)
	}
}

// readRows parses one JSON object per line; blank lines are skipped.
func readRows(path string) ([]usecase.ImportRow, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var rows []usecase.ImportRow
	sc := bufio.NewScanner(f)
	for line := 1; sc.Scan(); line++ {
		if len(sc.Bytes()) == 0 {
			continue
		}
		var r usecase.ImportRow
		if err := json.Unmarshal(sc.Bytes(), &r); err != nil {
			return nil, fmt.Errorf("line %d: %w", line, err)
		}
		r.Line = line
		rows = append(rows, r)
	}
	return rows, sc.Err()
}

// fileHash is the sha256 of the file in hex, recorded on the import batch.
func fileHash(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", fmt.Errorf("hash %s: %w", path, err)
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
