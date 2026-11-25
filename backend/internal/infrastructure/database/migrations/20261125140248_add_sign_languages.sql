-- +goose Up
-- Sign languages are Data Lab languages like the rest (ADR 0014). modality
-- says how a language is used: spoken languages are written and recorded
-- aloud, signed languages are recorded on camera.
ALTER TABLE languages ADD COLUMN modality TEXT NOT NULL DEFAULT 'spoken'
    CHECK (modality IN ('spoken', 'signed'));

-- Uganda Sign Language and Kenyan Sign Language, by their ISO 639-3 codes.
-- Neither has a standard written form, so the script is Zxxx (unwritten).
INSERT INTO languages (code, name, native_name, role, script, modality) VALUES
    ('ugn', 'Uganda Sign Language', 'Uganda Sign Language', 'target', 'Zxxx', 'signed'),
    ('xki', 'Kenyan Sign Language', 'Kenyan Sign Language', 'target', 'Zxxx', 'signed');

-- +goose Down
DELETE FROM languages WHERE code IN ('ugn', 'xki');
ALTER TABLE languages DROP COLUMN modality;
