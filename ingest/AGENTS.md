# AGENTS.md — ingest

Offline pipeline that turns openly licensed documents into Data Lab import files. Read `README.md` and ADR 0013 (`../docs/adr/0013-source-acquisition-and-licences.md`) first.

- A source is admitted only with a licence on the ADR 0013 allowlist, checked on the publisher's own pages. Record the evidence in the source's `licence_url`.
- Text is copied as published. Normalising quotes and whitespace is fine; rewording, summarising or translating is not. No model writes or rewrites a segment.
- A person approves every segment in the review sheet. The pipeline suggests; it never imports on its own.
- Be polite to publishers: honour robots.txt, keep the delay between requests, and cache fetched pages in `data/raw/`.
- Never commit anything under `data/`. Test fixtures are synthetic HTML in the publisher's markup, never copies of real articles.
- Tests (`uv run pytest`) cover the decisions: licence and credit verdicts, where a story's body ends, sentence filters, and the review-to-import build. Follow the testing policy in the root `AGENTS.md`.
