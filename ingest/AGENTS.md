# AGENTS.md — ingest

Offline pipeline that turns openly licensed documents into Data Lab import files. Read `README.md`, `SOURCES.md` and ADR 0013 (`../docs/adr/0013-source-acquisition-and-licences.md`) first.

- `SOURCES.md` is the ledger of every source checked. Look there before researching a source, and update it after every run, import (with its batch ids) or licence check.

- A source is admitted only with a licence on the ADR 0013 allowlist, checked on the publisher's own pages. Record the evidence in the source's `licence_url`.
- Text is copied as published. Normalising quotes and whitespace is fine; rewording, summarising or translating is not. No model writes or rewrites a segment.
- Only approved segments are built into an import file: rows `ingest approve` passes by rule (ADR 0013), plus any a person approves by hand. Importing is always a separate, explicit `make datalab-import`.
- Be polite to publishers: honour robots.txt, keep the delay between requests, and cache fetched pages in `data/raw/`.
- Never commit anything under `data/`. Test fixtures are synthetic HTML in the publisher's markup, never copies of real articles.
- Tests (`uv run pytest`) cover the decisions: licence and credit verdicts, where a story's body ends, sentence filters, and the review-to-import build. Follow the testing policy in the root `AGENTS.md`.
