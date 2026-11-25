---
topic: data-lab-admin
last_verified: 2026-11-25
sources:
  - internal/domain/datalab_admin.go
  - internal/usecase/datalab_admin.go
  - internal/infrastructure/database/postgres/datalab_admin_repository.go
  - internal/transport/handlers/datalab_admin_handler.go
  - internal/transport/middleware/admin_password.go
  - internal/transport/handlers/routes.go
  - internal/server/server.go
  - internal/bootstrap/bootstrap.go
  - ../web/app/(site)/data-lab/admin/
  - ../web/components/data-lab/admin/
  - ../web/lib/data-lab-admin/view.ts
---

# Data Lab admin

A page at `/data-lab/admin` on the web app for the team to see each volunteer's work: how much they've written and recorded, how much of it is verified, waiting or rejected, and every item's text beside what they entered. One shared password, `ADMIN_PASSWORD`, protects it. It is read-only.

## The password

- **`ADMIN_PASSWORD`** (`Config.AdminPassword`, trimmed): at least 12 characters, or startup fails. Empty turns the admin off: its routes aren't registered (404).
- **Changing it** locks everyone out at once: the web app sends the stored password on every page load, so the next one asks for the new password.
- **`middleware.AdminPassword`** (ported from Action Challenge):
  - It expects `Authorization: Bearer <password>` and compares SHA-256 digests with `subtle.ConstantTimeCompare`.
  - An empty password, given or configured, never matches.
  - Responses are `Cache-Control: no-store`: they hold names, emails and contributions.
- **Only wrong passwords are rate limited**, per IP: 10 in a row, then one every 5 seconds. Past that, every request from the IP gets 429 `too_many_attempts`, even with the right password, so a guess can't be confirmed. Right passwords are never counted, because every admin's requests come from the web app's server.

## Routes

All under `/api/v1/admin/data-lab`, outside the Firebase-authenticated group. Errors use the Data Lab's codes (`dataLabError`, see [data-lab.md](data-lab.md#errors)).

| Method | Path | Returns |
|---|---|---|
| GET | `/translators?language=` | `[Translator]`, never `null` |
| GET | `/translators/:id` | `Translator`, or 404 `not_found` |
| GET | `/contributions?contributor=&language=&status=&modality=&limit=&offset=` | `AdminContributionPage` |

A non-numeric `:id`, `contributor`, `limit` or `offset` is 400 `invalid_input`. Any route: 401 `unauthorized`, 429 `too_many_attempts`.

### Translators

`ListTranslators` lists every user who joined a language (`language_members`) or contributed, most contributions first, then by name. Each `Translator` (`internal/domain/datalab_admin.go`) has `joined_at`, `languages`, and the counts below. `languages` lists every language they joined, plus any they contributed in without being a member now (`level` `""`), each with `contributions`: everything they've written or recorded in it. It is ordered busiest first, and a language they joined but haven't worked in shows 0.

| Field | Counts |
|---|---|
| `written`, `recorded`, `signed` | their contributions with `modality` text / audio / video |
| `pending`, `verified`, `rejected` | the same contributions by `status` |
| `corrected` | verified ones whose review is a `correct`; part of `verified` |
| `reviewed` | reviews they made (`reviews.reviewer_id`) |
| `last_active_at` | their latest contribution or review; `null` when neither |

With `language`, only that language's members and contributors are listed, and every count (reviews included) covers that language only. `languages` still lists all their languages with their full counts, so the spread stays visible.

### Contributions

`ListContributions` returns `{total, contributions}`: `total` is every match (a separate `COUNT(*)`), and `contributions` the page, newest `created_at` first. Filters are all optional: `contributor` (user ID), `language`, `status` (`pending`, `verified`, `rejected`), `modality` (`text`, `audio`, `video`). An unknown status or modality is 400. `limit` defaults to 50 and is capped at 200; a negative `offset` is 0.

Each `AdminContribution` has the item (`item_text`, `item_language`, `kind`, `category`, `source_title`), what the volunteer entered (`text`; `""` for a recording), `pasted`, `status`, `submitted_at`, and `review`: `null` while pending, otherwise `{decision, reason, note, corrected_text, reviewer_id, reviewer_name, reviewed_at}`. A recording also has `read_text`, the verified text it reads (the reviewer's correction when there is one), and `audio_url` when storage is configured. A sign has `video_url`.

## Web app

- **Sign-in.** `/data-lab/admin` shows a password form until the `data_lab_admin` cookie is set. `signInToAdmin` (Server Action) checks the password against `/translators` and stores it only if it works: httpOnly, `sameSite: strict`, `path: /data-lab/admin`, 12 hours. A wrong password says so; a refused stored password (it changed) shows the form again with "The password has changed". **Sign out** deletes the cookie.
- **Server only.** `components/data-lab/admin/api.ts` is `server-only`; the password never reaches the browser. It calls `BACKEND_URL`, falling back to `NEXT_PUBLIC_BACKEND_URL`.
- **Translators** (`/data-lab/admin`): language chips, totals (volunteers, written, recorded, verified, waiting, rejected), and a table of every volunteer: each of their languages with how many contributions they've made in it (0 dimmed, for a language they joined but haven't started), the counts, accepted (verified ÷ (verified + rejected), "—" before any review), reviews of others, last active. Each name opens their page.
- **A translator** (`/data-lab/admin/translators/<id>`): their figures, language and status chips, then their contributions, 25 a page. Each card shows the original (or prompt) on the left, what they entered on the right (or the recording and the text it reads), and below it the status, "Pasted in", and the review: accepted, corrected (with the corrected text) or rejected with the reason, and any note.
- The view (language, status, page) is in the address (`lib/data-lab-admin/view.ts`), so reloads, Back and shared links keep it.
- It's standalone (`lib/site.ts`): its own bar instead of the site's header and footer. `noindex`.

## Testing

- `internal/transport/middleware/admin_password_test.go`: right, wrong, empty and missing passwords, `no-store`, the right password never limited, 429 after too many wrong ones (even for the right password).
- `internal/bootstrap/bootstrap_test.go`: the 12-character minimum.
- `internal/infrastructure/database/postgres/datalab_admin_repository_test.go` (Testcontainers): the counts per volunteer (corrections, recordings, reviews), each language's contributions busiest first with 0 for one not started, the order, a member with no work, the language and ID filters; contributions paired with their item, review and reviewer, a recording's `read_text` from the correction, filters, total and paging.
- `internal/usecase/datalab_admin_test.go`: the limit default and cap, negative offset, unknown status or modality, recording URLs, a missing translator.
- `internal/transport/handlers/datalab_admin_handler_test.go`: through `RegisterRoutes`: 200s, 401, off without a password, 404, 400s for non-numeric parameters, the filter passed on.
- `web/lib/data-lab-admin/view.test.ts`: reading the view from the address, links to a view, the acceptance rate.
