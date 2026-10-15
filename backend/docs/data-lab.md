---
topic: data-lab
last_verified: 2026-10-15
sources:
  - internal/domain/datalab.go
  - internal/usecase/datalab.go
  - internal/infrastructure/database/postgres/datalab_repository.go
  - internal/transport/handlers/datalab_handler.go
  - internal/usecase/datalab_errors.go
  - internal/transport/handlers/datalab_errors.go
  - internal/infrastructure/database/migrations/20261014060632_add_languages.sql
  - internal/infrastructure/database/migrations/20261014060907_add_language_members_and_consents.sql
  - internal/infrastructure/database/migrations/20261014061144_add_items_and_contributions.sql
  - internal/infrastructure/database/migrations/20261014061424_add_reviews.sql
  - internal/infrastructure/database/migrations/20261014061844_add_items_unique_text.sql
  - internal/infrastructure/database/migrations/20261014100628_add_review_corrections.sql
  - internal/infrastructure/database/migrations/20261015101841_add_voice_recordings.sql
  - internal/infrastructure/database/migrations/20261015103845_voice_reads_verified_translations.sql
  - internal/usecase/storage.go
  - internal/usecase/datalab_import.go
  - internal/infrastructure/database/postgres/datalab_import_repository.go
  - cmd/datalab/main.go
---

# Data Lab

The volunteer platform for creating, annotating, and verifying civic language datasets (ADR 0010). The web UI lives at `/data-lab`; this backend serves it under `/api/v1/data-lab`.

## Layers

| Layer | File | Holds |
|---|---|---|
| Domain | `internal/domain/datalab.go` | `Language` and the Data Lab constants |
| Use case | `internal/usecase/datalab.go` | `DataLab` (the API handlers call) and `DataLabStore` (the persistence it needs) |
| Repository | `internal/infrastructure/database/postgres/datalab_repository.go` | `DataLabStore` on Postgres |
| Handlers | `internal/transport/handlers/datalab_handler.go` | HTTP handlers, registered in `routes.go` |

## Languages

`languages` is reference data seeded by its migration: the nine target languages (BCP-47 codes shared with Watchtower) and English and French as source languages. Each row carries its ISO 15924 `script` and the `extra_characters` a standard keyboard lacks, which the web editor offers as a palette. Disable a language with `enabled = false`; never delete rows other tables reference.

## Volunteers, levels, and consent

A volunteer is a `users` row plus `language_members` (one row per language, with a `level`) and `consents` (one row per consent version accepted).

- **Onboarding** (`DataLab.Onboard`) takes a name, target languages, and the consent version the volunteer accepted. The version must equal `domain.CurrentConsentVersion`, or it fails with `ErrConsentOutdated`. Calling it again adds languages; `ON CONFLICT DO NOTHING` keeps any existing level.
- **Levels** are per language: `contributor` → `reviewer` → `lead`. New memberships start at `contributor`. Promotion is manual and done by the team with `make datalab-promote` (see Admin); there is no in-app promotion yet.
- **Consent**: bump `CurrentConsentVersion` when the consent text changes. Volunteers then accept again (by onboarding) before contributing.
- **Voice consent** is separate and optional: `AcceptVoiceConsent` sets `consents.covers_voice` on the volunteer's current consent row. `Volunteer.VoiceConsent` reports it, and `Volunteer.CanRecord()` (current consent that covers voice) gates every recording. A consent version bump asks for it again.

## Items, tasks, and contributions

- **Sources** (`sources`) record where items come from: a stable `key` from the import file, licence, and the `train`/`test` split, fixed at ingestion (ADR 0011).
- **Items** (`items`) are what volunteers work on. `translate` items are segments in a source language; `write` items are civic prompts to answer. One item serves every target language. `category` is one of `domain.CivicCategories`, which match the site's civic categories.
- **A task** is an item offered in one target language. `NextItem` picks at random among items that have no pending or verified contribution in that language and that the volunteer hasn't done. A rejected contribution reopens the item for everyone except its author.
- **Contributions** start `pending`, written (`modality = 'text'`) or recorded (`'audio'`, see Voice recordings). `(item_id, language_code, contributor_id, modality)` is unique, so a volunteer submits an item once per language in each modality. Each row records the consent version in force and whether the text was pasted.
- **Voice follows text.** `NextItem` takes a modality, and an item is open in a language and modality until it has a pending or verified contribution there. A recording reads a verified translation aloud, so `audio` tasks only offer `translate` items with a verified written contribution in the language, and the task's `text` is that translation (the reviewer's correction when there is one), in the language.

Contributing (`NextTask`, `Contribute`) requires, in order: onboarded, current consent, membership in the language, and the language **open**, meaning at least `domain.MinReviewersToOpen` (2) reviewers or leads. Text is trimmed and capped at `domain.MaxContributionLength` characters.

## Voice recordings

Once a translation is verified, volunteers can record it: the contribute screen shows the verified text in their language and they read it aloud. The verified translation is the recording's transcript, so there is no typed transcript. Only verified translations are recorded, which keeps the transcript exact and keeps storage to recordings worth keeping.

Recordings live in object storage (Cloudflare R2, `docs/storage.md`); without storage configured, `VoiceAvailable()` is false, `GET /data-lab/features` says `voice: false`, and voice requests fail with `ErrVoiceUnavailable`.

1. **Agree** once: `POST /data-lab/consent/voice` (`AcceptVoiceConsent`).
2. **Get a task** with `modality=audio`: a verified translation not yet recorded in the language.
3. **Upload**: `POST /data-lab/recordings` (`StartRecording`) with the item, language and the browser's recording type. It refuses an item without a verified translation, then returns a presigned `upload_url` (15 minutes), the `key`, and the `content_type` to upload with. The browser `PUT`s the file straight to R2; the API never handles the audio.
4. **Submit** the contribution with `modality: "audio"` and the `audio_key`. Any `text` is ignored.

On submit, the recording is linked to the translation it reads (`contributions.reads_contribution_id`), and `checkRecording` accepts the key only if:

- it sits under the volunteer's own prefix for the language, `data-lab/voice/<language>/<user id>/` (`domain.RecordingPrefix`); `StartRecording` names files with 16 random bytes in hex;
- the object exists (`StorageService.Stat`), so the upload finished;
- it is audio and at most `domain.MaxRecordingBytes` (10 MB).

Accepted types are `domain.RecordingTypes`: WebM and Ogg (Chrome, Edge, Firefox), MP4 (Safari), MP3 and WAV. Codec parameters are dropped (`audio/webm;codecs=opus` uploads as `audio/webm`), because the presigned URL is bound to the type.

Reviewers hear the recording against the text it reads (`ReviewItem.read_text`). They accept it or reject it, for example as `unclear` (too noisy, quiet or broken up) or `inaccurate` (doesn't match the text); a recording can't be corrected. A rejection reopens the translation for recording.

The bucket is **public**: a recording's URL is `R2_PUBLIC_URL/<key>`, which reviewers play from (`ReviewItem.audio_url`). The voice consent tells volunteers their recordings are published with the dataset. Keys are random, so recordings can't be listed or guessed, but anyone with a URL can play it.

The bucket needs a CORS rule that allows `PUT` from the web app's origins with the `Content-Type` header; see `docs/storage.md`.

## Reviews

A reviewer (level `reviewer` or `lead` in the language) takes the oldest pending contribution written by someone else (`NextPendingContribution`), then accepts or rejects it (`Review`):

- **Accept** sets the contribution to `verified`. It is part of the live corpus from that moment.
- **Correct** sets it to `verified` with the reviewer's `corrected_text`. Written contributions only: a recording is accepted or rejected. The translator's text stays on `contributions.text` and the correction goes on `reviews.corrected_text`, so both versions and both authors are kept; a row's verified text is `COALESCE(reviews.corrected_text, contributions.text)`. A correction must change the text (otherwise it's an Accept) and needs no further review: reviewers are chosen by the team (see below).
- **Reject** needs a reason from `domain.RejectReasons` (`inaccurate`, `incomplete`, `machine_translated`, `off_topic`, `unclear`, `other`) and sets it to `rejected`, which reopens the item for other volunteers.
- Nobody reviews their own work (`ErrOwnContribution`).
- `SaveReview` changes status only `WHERE status = 'pending'`, inside the same transaction as the review insert, so two reviewers racing on one contribution get one review and one `ErrAlreadyReviewed`.

One review per contribution for now (`reviews.contribution_id` is unique). Disputes and third reviewers (ADR 0010) come later.

## Live progress

`Progress` returns, per enabled target language, the written output in sentence pairs with English (written contributions to `translate` items): `available` (translate items, the whole every language works from), `translated` (pending review or verified), and `verified`. Recordings count separately: `recorded` (pending or verified, any item kind) and `recorded_verified`. It also returns `pending`, the review queue across all kinds and both modalities, and `open` (reviewers ≥ `MinReviewersToOpen`). Reviewer and member counts stay internal: `Reviewers` is `json:"-"`. It's public at `GET /api/v1/data-lab/progress`.

Answers to `write` prompts are original text, not pairs, so they count in `pending` while in review and in neither `translated` nor `verified`.

After every successful contribution and review, the use case reloads that language's counts and publishes them on the WebSocket hub as a `data-lab.progress` message:

```json
{"type": "data-lab.progress", "payload": {"code": "sw", "available": 120, "translated": 15, "verified": 12, "pending": 3, "open": true}}
```

`NewDataLab` takes a `Broadcaster` (satisfied by `*ws.Hub`, wired in `server.go`); nil turns broadcasting off. Publishing is best-effort: the write has already succeeded, so a failure is logged and not returned. `/ws` needs a Firebase token, so live updates reach signed-in volunteers; signed-out visitors read the endpoint.

## Admin: importing items and promoting volunteers

`cmd/datalab` runs admin tasks against the database in `.env`:

```bash
make datalab-sample                                              # import dev/data-lab/sample-items.jsonl
make datalab-import file=path/to/items.jsonl                     # import a file
make datalab-promote email=a@example.com language=sw level=reviewer
```

An import file has one JSON object per line:

```json
{"source": {"key": "council-notices-2026", "title": "Council notices", "origin": "…", "licence": "CC-BY-4.0"},
 "kind": "translate", "language": "en", "category": "public-services", "text": "The clinic opens at eight."}
```

- Every row is checked before anything is written (`Importer.ImportItems`), and all bad lines are reported together: the kind must be `translate` or `write`, the language a source language, the category one of `domain.CivicCategories`, and the source needs a key, title, and licence.
- Sources upsert by `key`. The split comes from `domain.SplitFor(key)` (about 1 in 10 to `test`) and is set only on first insert.
- Items are unique per `(source, kind, text)`, so importing the same file again adds nothing.
- `promote` changes the level of an existing membership. The volunteer must have joined that language first.

`dev/data-lab/sample-items.jsonl` is written for local development (licence CC0) and is not corpus data.

`make datalab-sample-translations` runs `dev/data-lab/sample-translations.sql`: verified Swahili translations of the sample's translate items, by a sample translator and accepted by a sample reviewer (both `@sample.invalid`), so Speak has something to record. It touches only items from the `dev-sample-civic` source and skips any sentence already translated, so it's safe to run again. Development only: it writes verified rows without a real review.

## Errors

Use cases return the sentinel errors in `usecase/datalab_errors.go`. `handlers.dataLabError` is the one place they become HTTP responses, with stable `code` values the web app branches on:

| Error | Status | `code` |
|---|---|---|
| `ErrNotOnboarded` | 403 | `onboarding_required` |
| `ErrConsentOutdated` | 403 | `consent_required` |
| `ErrNotMember` | 403 | `not_member` |
| `ErrLanguageClosed` | 409 | `language_closed` |
| `ErrNoTasks` | 404 | `no_tasks` |
| `ErrNotFound` | 404 | `not_found` |
| `ErrAlreadyContributed` | 409 | `already_contributed` |
| `ErrNotReviewer` | 403 | `not_reviewer` |
| `ErrOwnContribution` | 403 | `own_contribution` |
| `ErrAlreadyReviewed` | 409 | `already_reviewed` |
| `ErrNoReviews` | 404 | `no_reviews` |
| `ErrVoiceUnavailable` | 503 | `voice_unavailable` |
| `ErrVoiceConsentRequired` | 403 | `voice_consent_required` |
| `ErrInvalidInput` (via `invalid(msg)`) | 400 | `invalid_input` — message shown to the volunteer |
| anything else | 500 | `internal_error` — logged, detail hidden |

## Routes

| Method | Path | Auth | Handler |
|---|---|---|---|
| GET | `/api/v1/data-lab/languages` | none | `ListLanguagesHandler` — enabled languages, targets first |
| GET | `/api/v1/data-lab/progress` | none | `ProgressHandler` — live counts per target language |
| GET | `/api/v1/data-lab/features` | none | `FeaturesHandler` — `{voice}`: whether recordings can be stored |
| GET | `/api/v1/data-lab/me` | Firebase | `DataLabMeHandler` — profile, or 403 `onboarding_required` |
| POST | `/api/v1/data-lab/onboarding` | Firebase | `OnboardHandler` — join or add languages |
| POST | `/api/v1/data-lab/consent/voice` | Firebase | `AcceptVoiceConsentHandler` — agree to record |
| GET | `/api/v1/data-lab/tasks/next?language=&modality=` | Firebase | `NextTaskHandler` — next item to write (`text`, default) or say (`audio`), or 404 `no_tasks` |
| POST | `/api/v1/data-lab/recordings` | Firebase | `StartRecordingHandler` — 201 with an upload URL and key |
| POST | `/api/v1/data-lab/contributions` | Firebase | `ContributeHandler` — 201 with the pending contribution |
| GET | `/api/v1/data-lab/reviews/next?language=` | Firebase (reviewer) | `NextReviewHandler` — oldest pending, or 404 `no_reviews` |
| POST | `/api/v1/data-lab/reviews` | Firebase (reviewer) | `ReviewHandler` — 204 |
