-- +goose Up
-- One row per run of `cmd/datalab import`, so a bad import can be found and
-- its items retired (ADR 0013). file_hash is the sha256 hex of the file.
CREATE TABLE import_batches (
    id             BIGSERIAL   PRIMARY KEY,
    file_name      TEXT        NOT NULL,
    file_hash      TEXT        NOT NULL,
    imported_by    TEXT        NOT NULL DEFAULT '',
    sources_added  INT         NOT NULL,
    items_added    INT         NOT NULL,
    items_skipped  INT         NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A source is one document and carries the evidence for its licence
-- (ADR 0013): the document's URL, when it was retrieved, a link to the licence
-- evidence, and the object key and content hash of the raw copy in R2.
-- Documents from the same publisher or series share a collection, which does
-- not affect the split. Sources imported before this have none of it ('').
ALTER TABLE sources ADD COLUMN collection     TEXT NOT NULL DEFAULT '';
ALTER TABLE sources ADD COLUMN url            TEXT NOT NULL DEFAULT '';
ALTER TABLE sources ADD COLUMN retrieved_at   DATE;
ALTER TABLE sources ADD COLUMN licence_url    TEXT NOT NULL DEFAULT '';
ALTER TABLE sources ADD COLUMN raw_object_key TEXT NOT NULL DEFAULT '';
ALTER TABLE sources ADD COLUMN content_hash   TEXT NOT NULL DEFAULT '';

-- position is the segment's order within its document, when known.
-- A withdrawn item is retired, never deleted, because contributions refer to
-- it; retired items are no longer offered to volunteers.
-- import_batch_id is the import that added the item (none for older items).
ALTER TABLE items ADD COLUMN position INT;
ALTER TABLE items ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'retired'));
ALTER TABLE items ADD COLUMN import_batch_id BIGINT REFERENCES import_batches(id);

CREATE INDEX idx_items_import_batch ON items (import_batch_id);

-- +goose Down
DROP INDEX IF EXISTS idx_items_import_batch;
ALTER TABLE items DROP COLUMN IF EXISTS import_batch_id;
ALTER TABLE items DROP COLUMN IF EXISTS status;
ALTER TABLE items DROP COLUMN IF EXISTS position;
ALTER TABLE sources DROP COLUMN IF EXISTS content_hash;
ALTER TABLE sources DROP COLUMN IF EXISTS raw_object_key;
ALTER TABLE sources DROP COLUMN IF EXISTS licence_url;
ALTER TABLE sources DROP COLUMN IF EXISTS retrieved_at;
ALTER TABLE sources DROP COLUMN IF EXISTS url;
ALTER TABLE sources DROP COLUMN IF EXISTS collection;
DROP TABLE IF EXISTS import_batches;
