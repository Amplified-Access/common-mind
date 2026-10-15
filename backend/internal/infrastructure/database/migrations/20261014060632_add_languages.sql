-- +goose Up
-- Languages are reference data: the Data Lab can't run without them, so the
-- launch set is seeded here. Codes are BCP-47, matching Watchtower's locales;
-- native names match web/components/languages/data.ts.
CREATE TABLE languages (
    code              TEXT        PRIMARY KEY,
    name              TEXT        NOT NULL,
    native_name       TEXT        NOT NULL,
    -- 'target': volunteers contribute in it. 'source': text is translated from it.
    role              TEXT        NOT NULL CHECK (role IN ('target', 'source')),
    -- ISO 15924 script code, for input and font handling.
    script            TEXT        NOT NULL DEFAULT 'Latn',
    -- Letters a standard keyboard lacks, offered as an on-screen palette.
    extra_characters  TEXT[]      NOT NULL DEFAULT '{}',
    enabled           BOOLEAN     NOT NULL DEFAULT true,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO languages (code, name, native_name, role, script, extra_characters) VALUES
    ('sw',  'Swahili',     'Kiswahili',    'target', 'Latn', '{}'),
    ('lg',  'Luganda',     'Oluganda',     'target', 'Latn', '{ŋ}'),
    ('rw',  'Kinyarwanda', 'Ikinyarwanda', 'target', 'Latn', '{}'),
    ('am',  'Amharic',     'አማርኛ',         'target', 'Ethi', '{}'),
    ('ki',  'Kikuyu',      'Gĩkũyũ',       'target', 'Latn', '{ĩ,ũ}'),
    ('suk', 'Sukuma',      'Kisukuma',     'target', 'Latn', '{}'),
    ('luo', 'Dholuo',      'Dholuo',       'target', 'Latn', '{}'),
    ('om',  'Oromo',       'Afaan Oromoo', 'target', 'Latn', '{}'),
    ('din', 'Dinka',       'Thuɔŋjäŋ',     'target', 'Latn', '{ä,ë,ɛ,ɛ̈,ï,ö,ɔ,ɔ̈,ŋ,ɣ}'),
    ('en',  'English',     'English',      'source', 'Latn', '{}'),
    ('fr',  'French',      'Français',     'source', 'Latn', '{}');

-- +goose Down
DROP TABLE IF EXISTS languages;
