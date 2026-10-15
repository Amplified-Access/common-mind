-- +goose Up
-- Re-importing a file must not duplicate items: the same text of the same
-- kind appears once per source.
CREATE UNIQUE INDEX idx_items_source_kind_text ON items (source_id, kind, md5(text));

-- +goose Down
DROP INDEX IF EXISTS idx_items_source_kind_text;
