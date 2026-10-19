# CommonMind ingest

Turns openly licensed documents into Data Lab import files: the English source segments volunteers translate. It runs offline on a laptop, and a person approves every segment before it reaches the database ([ADR 0013](../docs/adr/0013-source-acquisition-and-licences.md)). The import format and the importer's checks are in [backend/docs/data-lab.md](../backend/docs/data-lab.md).

The first source is **VOA Learning English**: plain-language news, public domain when VOA produced it.

## Running it

Needs Python 3.11+ and [uv](https://docs.astral.sh/uv/). Run every command from `ingest/`.

```bash
uv sync
uv run ingest voa-discover    # story URLs about the launch countries -> data/voa/urls.txt
uv run ingest voa-fetch       # download and judge each story         -> data/voa/articles.jsonl
uv run ingest review          # candidate sentences                    -> data/voa/review.csv
# approve rows in data/voa/review.csv
uv run ingest build           # approved rows                          -> data/voa/items.jsonl

cd ../backend
make datalab-check file=../ingest/data/voa/items.jsonl    # dry run: validate and count
make datalab-import file=../ingest/data/voa/items.jsonl   # import
```

Everything under `data/` stays local and is ignored by git. Fetched pages are kept in `data/raw/`, so a rerun reads them from disk and fetches only new stories. The client waits two seconds between requests.

```bash
uv run pytest
```

## How a VOA story is judged

VOA's terms put in the public domain only what is "produced exclusively by the Voice of America", and forbid rewriting AP material ([terms](https://learningenglish.voanews.com/p/6021.html)). Many Learning English stories are adaptations of wire copy, so each story is judged by its credit line, the paragraph after the reporter's sign-off:

| Credit line | Verdict |
|---|---|
| "Jane Doe reported this story for VOA News. Jill Robbins adapted it for Learning English." | accepted |
| "VOA's Salem Solomon reported this story…", "…wrote this story for VOANews.com…" | accepted |
| Names the Associated Press, AP, Reuters, AFP or Agence France-Presse anywhere | rejected |
| Reported for, or adapted from, any other organisation | rejected |
| No credit line (common on pages from before 2015) | rejected |

An accepted story must also mention a launch country in its title or text.

**Discovery** reads the site's sitemaps, because the site search is closed to robots. It matches story URLs whose slug names a launch country or its cities. Newer stories have ID-only URLs (`/a/8207750.html`) and are not found this way yet.

## The review sheet

`review` keeps stories with at least three civic keyword stems. It splits each story into sentences and leaves out sentences that are:
- under 5 or over 40 words;
- led by a pronoun ("He said…"), since they need the sentence before them;
- holding contact details;
- mostly numbers;
- already seen in another story.

Each remaining sentence is a row in `data/voa/review.csv`:

| Column | Meaning |
|---|---|
| `approve` | Put `y` to approve the row. Blank rows are left out. |
| `category` | A guess from keywords. Correct it, or fill it in when blank. It must be one of the civic category ids. |
| `text` | The sentence, quotes and spaces normalised. Don't edit the wording. |
| `flags` | `quote`: contains quoted speech. `names`: may name a person. `context`: starts with a word like "This" or "But". |
| `source_key`, `position`, `title`, `url`, `published` | Where the sentence comes from. `position` is its place among the story's sentences. |

Approve a sentence when it:
- reads as plain civic language;
- makes sense on its own;
- names no private individual. Public officials are fine (ADR 0013).

`build` refuses the sheet if any approved row lacks a valid category, and lists every such row.

## Adding a source

Write a module beside `voa.py` that produces article records: `key`, `title`, `url`, `published`, `paragraphs`, `accepted`, `reason`, and `source` (the import file's source object, with licence and evidence). `review` and `build` work on any source's records. Check the licence against the allowlist in ADR 0013 before writing any code.
