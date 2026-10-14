-- +goose Up
-- Where items come from. `key` is the stable ID from the import file; the
-- split is derived from it once, at ingestion, so a source never moves between
-- train and test across releases (ADR 0011).
CREATE TABLE sources (
    id          BIGSERIAL   PRIMARY KEY,
    key         TEXT        NOT NULL UNIQUE,
    title       TEXT        NOT NULL,
    origin      TEXT        NOT NULL DEFAULT '',
    licence     TEXT        NOT NULL,
    split       TEXT        NOT NULL CHECK (split IN ('train', 'test')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- What volunteers work on. A 'translate' item is a source-language segment to
-- render into the volunteer's language; a 'write' item is a civic prompt to
-- answer in it. One item serves every target language.
CREATE TABLE items (
    id             BIGSERIAL   PRIMARY KEY,
    source_id      BIGINT      NOT NULL REFERENCES sources(id),
    kind           TEXT        NOT NULL CHECK (kind IN ('translate', 'write')),
    language_code  TEXT        NOT NULL REFERENCES languages(code),
    category       TEXT        NOT NULL,
    text           TEXT        NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_items_source ON items (source_id);

-- A volunteer's translation or written answer, in one target language.
CREATE TABLE contributions (
    id               BIGSERIAL   PRIMARY KEY,
    item_id          BIGINT      NOT NULL REFERENCES items(id),
    language_code    TEXT        NOT NULL REFERENCES languages(code),
    contributor_id   BIGINT      NOT NULL REFERENCES users(id),
    text             TEXT        NOT NULL,
    modality         TEXT        NOT NULL DEFAULT 'text' CHECK (modality IN ('text', 'audio')),
    -- Set when the text was pasted in; reviewers see it (ADR 0010 MT guard).
    pasted           BOOLEAN     NOT NULL DEFAULT false,
    consent_version  TEXT        NOT NULL,
    status           TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'verified', 'rejected')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (item_id, language_code, contributor_id)
);

CREATE INDEX idx_contributions_language_status ON contributions (language_code, status);

-- +goose Down
DROP TABLE IF EXISTS contributions;
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS sources;
