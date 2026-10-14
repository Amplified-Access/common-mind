-- +goose Up
-- Volunteer accounts, keyed by their Firebase UID. Studio tables (languages,
-- consent, tasks, contributions, reviews, snapshots) come in later migrations.
CREATE TABLE IF NOT EXISTS users (
    id           BIGSERIAL    PRIMARY KEY,
    firebase_uid TEXT         NOT NULL UNIQUE,
    name         TEXT         NOT NULL DEFAULT '',
    email        TEXT         NOT NULL DEFAULT '',
    photo_url    TEXT         NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE IF EXISTS users;
