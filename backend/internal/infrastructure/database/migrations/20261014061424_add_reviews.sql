-- +goose Up
-- A second speaker's decision on a contribution. One review per contribution
-- for now; disputes and third reviewers come later (ADR 0010).
CREATE TABLE reviews (
    id               BIGSERIAL   PRIMARY KEY,
    contribution_id  BIGINT      NOT NULL UNIQUE REFERENCES contributions(id),
    reviewer_id      BIGINT      NOT NULL REFERENCES users(id),
    decision         TEXT        NOT NULL CHECK (decision IN ('accept', 'reject')),
    reason           TEXT        CHECK (reason IN ('inaccurate', 'incomplete', 'machine_translated', 'off_topic', 'other')),
    note             TEXT        NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- A rejection always says why, so contributors and the MT guard can use it.
    CHECK (decision = 'accept' OR reason IS NOT NULL)
);

CREATE INDEX idx_reviews_reviewer ON reviews (reviewer_id);

-- +goose Down
DROP TABLE IF EXISTS reviews;
