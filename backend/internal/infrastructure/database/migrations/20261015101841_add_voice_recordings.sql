-- +goose Up
-- Voice recordings (ADR 0010: text first, voice second). An audio
-- contribution is a recording in object storage at audio_key, with an
-- optional typed transcript in text ('' when the speaker gave none).
ALTER TABLE contributions ADD COLUMN audio_key TEXT UNIQUE;

-- A recording always has its file, and only a recording has one.
ALTER TABLE contributions ADD CONSTRAINT contributions_audio_key_check
    CHECK ((modality = 'audio') = (audio_key IS NOT NULL));

-- Typed contributions still need text; a recording's transcript is optional.
ALTER TABLE contributions ADD CONSTRAINT contributions_text_check
    CHECK (modality = 'audio' OR text <> '');

-- Text and voice are tracked separately: an item can get one written and one
-- spoken contribution per language, and a volunteer can give both.
ALTER TABLE contributions DROP CONSTRAINT contributions_item_id_language_code_contributor_id_key;
ALTER TABLE contributions ADD CONSTRAINT contributions_item_language_contributor_modality_key
    UNIQUE (item_id, language_code, contributor_id, modality);

-- +goose Down
DELETE FROM reviews WHERE contribution_id IN (SELECT id FROM contributions WHERE modality = 'audio');
DELETE FROM contributions WHERE modality = 'audio';
ALTER TABLE contributions DROP CONSTRAINT contributions_item_language_contributor_modality_key;
ALTER TABLE contributions ADD CONSTRAINT contributions_item_id_language_code_contributor_id_key
    UNIQUE (item_id, language_code, contributor_id);
ALTER TABLE contributions DROP CONSTRAINT contributions_text_check;
ALTER TABLE contributions DROP CONSTRAINT contributions_audio_key_check;
ALTER TABLE contributions DROP COLUMN audio_key;
