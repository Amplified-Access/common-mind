package postgres

import (
	"context"
	"database/sql"
	"log"
	"testing"
	"time"

	"github.com/pressly/goose/v3"
	"github.com/testcontainers/testcontainers-go"
	tcpostgres "github.com/testcontainers/testcontainers-go/modules/postgres"
	"github.com/testcontainers/testcontainers-go/wait"
)

var testDB *sql.DB

func mustStartPostgresContainer() (func(context.Context, ...testcontainers.TerminateOption) error, error) {
	var (
		dbName = "database"
		dbPwd  = "password"
		dbUser = "user"
	)

	container, err := tcpostgres.Run(
		context.Background(),
		"postgres:16",
		tcpostgres.WithDatabase(dbName),
		tcpostgres.WithUsername(dbUser),
		tcpostgres.WithPassword(dbPwd),
		testcontainers.WithWaitStrategy(
			wait.ForLog("database system is ready to accept connections").
				WithOccurrence(2).
				WithStartupTimeout(5*time.Second),
		),
	)
	if err != nil {
		return nil, err
	}

	dbHost, err := container.Host(context.Background())
	if err != nil {
		return container.Terminate, err
	}

	dbPort, err := container.MappedPort(context.Background(), "5432/tcp")
	if err != nil {
		return container.Terminate, err
	}

	cfg := DBConfig{
		Host:     dbHost,
		Port:     dbPort.Port(),
		Database: dbName,
		Username: dbUser,
		Password: dbPwd,
		Schema:   "public",
		SSLMode:  "disable",
	}

	db, err := NewPostgresDB(cfg)
	if err != nil {
		return container.Terminate, err
	}
	testDB = db

	// Tests run against the real schema, so the migrations are exercised too.
	if err := goose.SetDialect("postgres"); err != nil {
		return container.Terminate, err
	}
	goose.SetLogger(goose.NopLogger())
	if err := goose.Up(db, "../migrations"); err != nil {
		return container.Terminate, err
	}

	return container.Terminate, nil
}

func TestMain(m *testing.M) {
	teardown, err := mustStartPostgresContainer()
	if err != nil {
		log.Fatalf("could not start postgres container: %v", err)
	}

	m.Run()

	if teardown != nil && teardown(context.Background()) != nil {
		log.Fatalf("could not teardown postgres container: %v", err)
	}
}

func TestNew(t *testing.T) {
	if testDB == nil {
		t.Fatal("NewPostgresDB() returned nil db")
	}
}

func TestHealth(t *testing.T) {
	repo := NewHealthRepository(testDB)

	stats, err := repo.Health(context.Background())
	if err != nil {
		t.Fatalf("Health() returned unexpected error: %v", err)
	}
	if stats.Status != "up" {
		t.Fatalf("expected status to be up, got %s", stats.Status)
	}
	if stats.Error != "" {
		t.Fatalf("expected no error, got %s", stats.Error)
	}
}

// truncate empties the given tables when the test ends, so each test starts
// from the migrated schema with no rows.
func truncate(t *testing.T, tables ...string) {
	t.Helper()
	t.Cleanup(func() {
		for _, table := range tables {
			if _, err := testDB.Exec("TRUNCATE " + table + " RESTART IDENTITY CASCADE"); err != nil {
				t.Errorf("truncate %s: %v", table, err)
			}
		}
	})
}
