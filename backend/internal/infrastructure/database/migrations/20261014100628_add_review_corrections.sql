-- +goose Up
-- Reviewers can correct a contribution as they verify it. The translator's
-- text stays on the contribution; the reviewer's corrected text lives on the
-- review, so both versions and both authors are kept. The verified text of a
-- row is COALESCE(reviews.corrected_text, contributions.text).
ALTER TABLE reviews ADD COLUMN corrected_text TEXT;

ALTER TABLE reviews DROP CONSTRAINT reviews_decision_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_decision_check
    CHECK (decision IN ('accept', 'correct', 'reject'));

-- The original rule, "accept or give a reason", read as "only a rejection
-- needs a reason"; with corrections it has to say exactly that.
ALTER TABLE reviews DROP CONSTRAINT reviews_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_reject_reason_check
    CHECK (decision <> 'reject' OR reason IS NOT NULL);

-- A correction always carries its text, and only a correction does.
ALTER TABLE reviews ADD CONSTRAINT reviews_corrected_text_check
    CHECK ((decision = 'correct') = (corrected_text IS NOT NULL));

-- +goose Down
ALTER TABLE reviews DROP CONSTRAINT reviews_corrected_text_check;
DELETE FROM reviews WHERE decision = 'correct';
ALTER TABLE reviews DROP CONSTRAINT reviews_reject_reason_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_check
    CHECK (decision = 'accept' OR reason IS NOT NULL);
ALTER TABLE reviews DROP CONSTRAINT reviews_decision_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_decision_check
    CHECK (decision IN ('accept', 'reject'));
ALTER TABLE reviews DROP COLUMN corrected_text;
