-- +goose Up
-- Karimojong (Ngakarimojong), an Eastern Nilotic language of Karamoja in
-- north-eastern Uganda. It has no ISO 639-1 code, so it takes the ISO 639-3
-- code kdj, as suk and din do.
INSERT INTO languages (code, name, native_name, role, script, extra_characters) VALUES
    ('kdj', 'Karimojong', 'Ngakarimojong', 'target', 'Latn', '{ŋ}');

-- +goose Down
DELETE FROM languages WHERE code = 'kdj';
