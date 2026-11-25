-- +goose Up
-- Signed contributions (ADR 0014). A 'word' item is a civic word or short
-- phrase to sign; signers get words before sentences.
ALTER TABLE items DROP CONSTRAINT items_kind_check;
ALTER TABLE items ADD CONSTRAINT items_kind_check CHECK (kind IN ('translate', 'write', 'word'));

-- A 'video' contribution is a signer's recording at video_key, with the hand,
-- body and face landmarks tracked while recording at landmarks_key (optional:
-- they can be extracted from the video later).
ALTER TABLE contributions DROP CONSTRAINT contributions_modality_check;
ALTER TABLE contributions ADD CONSTRAINT contributions_modality_check
    CHECK (modality IN ('text', 'audio', 'video'));

ALTER TABLE contributions ADD COLUMN video_key TEXT UNIQUE;
ALTER TABLE contributions ADD COLUMN landmarks_key TEXT UNIQUE;

ALTER TABLE contributions ADD CONSTRAINT contributions_video_key_check
    CHECK ((modality = 'video') = (video_key IS NOT NULL));
ALTER TABLE contributions ADD CONSTRAINT contributions_landmarks_key_check
    CHECK (landmarks_key IS NULL OR modality = 'video');

-- Only written contributions carry text; recordings of either kind have none.
ALTER TABLE contributions DROP CONSTRAINT contributions_text_check;
ALTER TABLE contributions ADD CONSTRAINT contributions_text_check
    CHECK (modality <> 'text' OR text <> '');

-- Video shows a signer's face and hands, so it has its own consent.
ALTER TABLE consents ADD COLUMN covers_video BOOLEAN NOT NULL DEFAULT false;

-- +goose Down
ALTER TABLE consents DROP COLUMN covers_video;
DELETE FROM reviews WHERE contribution_id IN (SELECT id FROM contributions WHERE modality = 'video');
DELETE FROM contributions WHERE modality = 'video';
ALTER TABLE contributions DROP CONSTRAINT contributions_text_check;
ALTER TABLE contributions ADD CONSTRAINT contributions_text_check
    CHECK (modality = 'audio' OR text <> '');
ALTER TABLE contributions DROP CONSTRAINT contributions_landmarks_key_check;
ALTER TABLE contributions DROP CONSTRAINT contributions_video_key_check;
ALTER TABLE contributions DROP COLUMN landmarks_key;
ALTER TABLE contributions DROP COLUMN video_key;
ALTER TABLE contributions DROP CONSTRAINT contributions_modality_check;
ALTER TABLE contributions ADD CONSTRAINT contributions_modality_check
    CHECK (modality IN ('text', 'audio'));
DELETE FROM contributions WHERE item_id IN (SELECT id FROM items WHERE kind = 'word');
DELETE FROM items WHERE kind = 'word';
ALTER TABLE items DROP CONSTRAINT items_kind_check;
ALTER TABLE items ADD CONSTRAINT items_kind_check CHECK (kind IN ('translate', 'write'));
