-- Verified Swahili translations of the development sample
-- (sample-items.jsonl), so the Data Lab has verified translations to record
-- and review locally. Run with `make datalab-sample-translations` after
-- `make datalab-sample`.
--
-- Development only, and not corpus data: it touches nothing but items from
-- the 'dev-sample-civic' source, which exists only in development. The
-- translations are by a sample translator and verified by a sample
-- reviewer, both with .invalid emails. A sentence that already has a
-- pending or verified Swahili translation is left alone, so it's safe to
-- run again.
BEGIN;

INSERT INTO users (firebase_uid, name, email) VALUES
    ('dev-sample-translator', 'Sample translator', 'translator@sample.invalid'),
    ('dev-sample-reviewer',   'Sample reviewer',   'reviewer@sample.invalid')
ON CONFLICT (firebase_uid) DO NOTHING;

INSERT INTO language_members (user_id, language_code, level)
SELECT id, 'sw', CASE firebase_uid WHEN 'dev-sample-reviewer' THEN 'reviewer' ELSE 'contributor' END
FROM users WHERE firebase_uid IN ('dev-sample-translator', 'dev-sample-reviewer')
ON CONFLICT (user_id, language_code) DO NOTHING;

INSERT INTO consents (user_id, version)
SELECT id, '2026-10-14' FROM users WHERE firebase_uid IN ('dev-sample-translator', 'dev-sample-reviewer')
ON CONFLICT (user_id, version) DO NOTHING;

WITH translations (en, sw) AS (VALUES
    ('The borehole in our village has been broken for two weeks, and families are walking to the river for water.',
     'Kisima cha kijiji chetu kimeharibika kwa wiki mbili, na familia zinatembea hadi mtoni kuchota maji.'),
    ('Street lights on the main road stopped working last month, and people feel unsafe walking home at night.',
     'Taa za barabarani kwenye barabara kuu ziliacha kufanya kazi mwezi uliopita, na watu hawajisikii salama wakitembea kurudi nyumbani usiku.'),
    ('The health centre will open from eight in the morning to five in the evening, Monday to Saturday.',
     'Kituo cha afya kitafunguliwa kuanzia saa mbili asubuhi hadi saa kumi na moja jioni, Jumatatu hadi Jumamosi.'),
    ('Children who have not received the measles vaccine can get it free of charge at the clinic this Friday.',
     'Watoto ambao hawajapata chanjo ya surua wanaweza kuipata bila malipo katika zahanati Ijumaa hii.'),
    ('The sub-county council will meet on Thursday to discuss next year''s budget for roads and schools.',
     'Baraza la kaunti ndogo litakutana Alhamisi kujadili bajeti ya mwaka ujao ya barabara na shule.'),
    ('You can check your polling station by sending your national ID number by text message to the electoral commission.',
     'Unaweza kujua kituo chako cha kupigia kura kwa kutuma namba ya kitambulisho chako cha taifa kwa ujumbe mfupi kwa tume ya uchaguzi.'),
    ('The district has published how much money was spent on the new market and who built it.',
     'Wilaya imechapisha kiasi cha fedha kilichotumika kujenga soko jipya na aliyelijenga.'),
    ('Most residents who spoke at the meeting said clean water should come before a new road.',
     'Wakazi wengi waliozungumza kwenye mkutano walisema maji safi yanapaswa kutangulia barabara mpya.'),
    ('Every citizen has the right to attend council meetings and to ask questions about public spending.',
     'Kila raia ana haki ya kuhudhuria mikutano ya baraza na kuuliza maswali kuhusu matumizi ya fedha za umma.'),
    ('A community meeting about the new bus stage will be held at the primary school grounds on Saturday afternoon.',
     'Mkutano wa jamii kuhusu kituo kipya cha mabasi utafanyika katika uwanja wa shule ya msingi Jumamosi mchana.'),
    ('The councillor promised that the bridge would be repaired before the rainy season.',
     'Diwani aliahidi kwamba daraja litakarabatiwa kabla ya msimu wa mvua.'),
    ('Construction of the new classroom block is expected to finish in March.',
     'Ujenzi wa jengo jipya la madarasa unatarajiwa kukamilika mwezi Machi.'),
    ('Please tell us what you think about the new waste collection schedule by calling the number below.',
     'Tafadhali tuambie maoni yako kuhusu ratiba mpya ya ukusanyaji taka kwa kupiga namba iliyo hapa chini.')
),
added AS (
    INSERT INTO contributions (item_id, language_code, contributor_id, text, consent_version, status)
    SELECT i.id, 'sw', u.id, t.sw, '2026-10-14', 'verified'
    FROM translations t
    JOIN items i ON i.text = t.en AND i.kind = 'translate'
    JOIN sources s ON s.id = i.source_id AND s.key = 'dev-sample-civic'
    CROSS JOIN (SELECT id FROM users WHERE firebase_uid = 'dev-sample-translator') u
    WHERE NOT EXISTS (
        SELECT 1 FROM contributions c
        WHERE c.item_id = i.id AND c.language_code = 'sw' AND c.modality = 'text'
          AND c.status IN ('pending', 'verified'))
    RETURNING id
)
INSERT INTO reviews (contribution_id, reviewer_id, decision)
SELECT a.id, r.id, 'accept'
FROM added a CROSS JOIN (SELECT id FROM users WHERE firebase_uid = 'dev-sample-reviewer') r;

COMMIT;
