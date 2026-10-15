-- +goose Up
-- A volunteer's standing in each language they work in. Trust is per
-- language: a reviewer in Dholuo is a contributor everywhere else.
CREATE TABLE language_members (
    user_id        BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language_code  TEXT        NOT NULL REFERENCES languages(code),
    level          TEXT        NOT NULL DEFAULT 'contributor'
                               CHECK (level IN ('contributor', 'reviewer', 'lead')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, language_code)
);

CREATE INDEX idx_language_members_language_level ON language_members (language_code, level);

-- One row per consent version a volunteer accepted. Every contribution
-- records the version in force when it was made.
CREATE TABLE consents (
    user_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version      TEXT        NOT NULL,
    covers_voice BOOLEAN     NOT NULL DEFAULT false,
    accepted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, version)
);

-- +goose Down
DROP TABLE IF EXISTS consents;
DROP TABLE IF EXISTS language_members;
