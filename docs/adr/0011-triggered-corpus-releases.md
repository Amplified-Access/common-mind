# ADR 0011 — Live corpus with metric-triggered snapshot releases

**Status:** Accepted  
**Date:** 2026-10-14

## Context

The data studio (ADR 0010) adds each row to the corpus the moment it passes verification. Contributors and dashboards work against that live corpus. Training runs and CivicBench need fixed, citable versions that never change underneath them. Releasing on a calendar would cut versions with too little new data in some languages and too late in others.

## Decision

Keep two layers: the **live corpus** and immutable **snapshot releases**. A release is proposed by **triggers** and allowed only when every **gate** passes. A trigger firing does not publish anything by itself.

**Triggers** (any one proposes a release, per language):
- Volume growth: a set number of new verified rows, or a set percentage, since the language's last release.
- New language: a language reaches its first threshold of verified rows (its v0.1).
- Category coverage: a civic category that was below its minimum share now meets it.
- Staleness floor: a set time since the last release, with a minimum of new rows.

**Gates** (all must pass):
- Reviewer agreement for the language at or above a threshold.
- Gold-row accuracy of contributors in the batch at or above a threshold.
- No open disputes in the snapshot.
- Personal-data scan clean.
- No near-duplicates within the release or against the test split.

Thresholds are configuration, set per language, and are tuned once real data arrives.

**Release flow:** trigger fires → a content-hashed candidate snapshot is frozen to R2 → gates run as Asynq jobs → a person signs off → the snapshot is published to Hugging Face and Kaggle with a generated datasheet and changelog.

**Versioning:** major for schema changes, minor for triggered releases, patch for corrections and consent withdrawals.

**Test split:** assigned when a source document is first ingested, by hashing its ID, so a row never moves between splits across releases.

## Consequences

### Positive
- Releases follow the data: a fast-growing language releases often, a slow one releases when it has something worth releasing.
- Progress toward the next trigger can be shown to volunteers as a shared goal.
- A stable test split keeps CivicBench free of leakage.

### Negative / trade-offs
- The release engine (trigger evaluation, gates, snapshot builder, publishers) is a substantial piece of backend work.
- Human sign-off adds a step before each release. It is kept on purpose for early releases.
