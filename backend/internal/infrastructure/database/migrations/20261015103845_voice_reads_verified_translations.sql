-- +goose Up
-- A recording reads a verified translation aloud, so the verified text is
-- its transcript: reads_contribution_id is the written contribution it
-- voices. Recordings no longer carry typed transcripts of their own.
ALTER TABLE contributions ADD COLUMN reads_contribution_id BIGINT REFERENCES contributions(id);

ALTER TABLE contributions ADD CONSTRAINT contributions_reads_check
    CHECK ((modality = 'audio') = (reads_contribution_id IS NOT NULL));

ALTER TABLE contributions ADD CONSTRAINT contributions_audio_text_check
    CHECK (modality = 'text' OR text = '');

-- 'unclear': a recording too noisy, quiet or broken up to use.
ALTER TABLE reviews DROP CONSTRAINT reviews_reason_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_reason_check
    CHECK (reason IN ('inaccurate', 'incomplete', 'machine_translated', 'off_topic', 'unclear', 'other'));

-- +goose Down
UPDATE reviews SET reason = 'other' WHERE reason = 'unclear';
ALTER TABLE reviews DROP CONSTRAINT reviews_reason_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_reason_check
    CHECK (reason IN ('inaccurate', 'incomplete', 'machine_translated', 'off_topic', 'other'));
ALTER TABLE contributions DROP CONSTRAINT contributions_audio_text_check;
ALTER TABLE contributions DROP CONSTRAINT contributions_reads_check;
ALTER TABLE contributions DROP COLUMN reads_contribution_id;
