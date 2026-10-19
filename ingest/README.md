# CommonMind ingest

Turns openly licensed documents into Data Lab import files: the English source segments volunteers translate. It runs offline on a laptop, and only approved segments reach the database ([ADR 0013](../docs/adr/0013-source-acquisition-and-licences.md)). The import format and the importer's checks are in [backend/docs/data-lab.md](../backend/docs/data-lab.md).

Sources so far, all public domain when VOA produced the story:

| `--site` | Source | Judged by |
|---|---|---|
| `voa-le` | [VOA Learning English](https://learningenglish.voanews.com): plain-language news | the credit line |
| `voa-af` | [VOA Africa](https://www.voaafrica.com): VOA's Africa news, including South Sudan in Focus | the byline |

## Running it

Needs Python 3.11+ and [uv](https://docs.astral.sh/uv/). Run every command from `ingest/`.

```bash
uv sync
uv run ingest discover --site voa-af   # story URLs about the launch countries -> data/voa-af/urls.txt
uv run ingest fetch    --site voa-af   # download and judge each story         -> data/voa-af/articles.jsonl
uv run ingest review   --site voa-af   # candidate sentences                    -> data/voa-af/review.csv
uv run ingest approve  --site voa-af   # approve the rows that need no judgement
uv run ingest build    --site voa-af   # approved rows                          -> data/voa-af/items.jsonl

cd ../backend
make datalab-check  file=../ingest/data/voa-af/items.jsonl   # dry run: validate and count
make datalab-import file=../ingest/data/voa-af/items.jsonl   # import
```

Everything under `data/` stays local and is ignored by git. Fetched pages are kept in `data/raw/<site>/`, so a rerun reads them from disk and fetches only new stories. Fetching uses four workers, and request starts stay at least a second apart. Re-importing a file is safe: items already in the database are skipped.

```bash
uv run pytest
```

## How a story is judged

VOA's terms put in the public domain only what is "produced exclusively by the Voice of America". AP, Reuters and AFP material stays copyrighted ([Learning English terms](https://learningenglish.voanews.com/p/6021.html), [VOA Africa terms](https://www.voaafrica.com/p/8177.html)). Both sites carry wire copy, so each story is judged before any of its text is used.

**Learning English** stories end with a credit line saying who reported the story and for whom:

| Credit line | Verdict |
|---|---|
| "Jane Doe reported this story for VOA News. Jill Robbins adapted it for Learning English." | accepted |
| "VOA's Salem Solomon reported this story…", "…wrote this story for VOANews.com…" | accepted |
| "Lenny Ruvaga reported this story from Nairobi. Christopher Jones-Cruise adapted it for Learning English." (a VOA correspondent, no other organisation named) | accepted |
| Names the Associated Press, AP, Reuters, AFP or Agence France-Presse anywhere | rejected |
| Reported for, or adapted from, any other organisation | rejected |
| No credit line (common on pages from before 2015) | rejected |

**VOA Africa** stories carry a byline. Wire stories are bylined with the agency ("Reuters", "Agence France-Presse"). A story is accepted when its byline is a person or VOA, and no line such as "Some information in this report came from Reuters" acknowledges wire material. Audio and video pages without story text are left out.

An accepted story must also mention a launch country in its title or text.

**Discovery** reads each site's sitemaps, because site search is closed to robots. It matches story URLs whose slug names a launch country or its cities. Stories with ID-only URLs (`/a/8207750.html`) are not found this way.

**Keys.** Learning English sources are keyed `voa-le-<id>`. VOA Africa shares story ids with voanews.com, so its sources are keyed `voa-<id>`, and a story published on both sites stays one source.

## The review sheet

`review` keeps stories with at least three civic keyword stems. It splits each story into sentences and leaves out sentences that are:
- under 5 or over 40 words;
- led by a pronoun ("He said…"), since they need the sentence before them;
- part of a longer quotation (an unbalanced quote mark);
- holding contact details;
- about VOA itself;
- questions;
- mostly numbers;
- already seen in another story.

Each remaining sentence is a row in `data/<site>/review.csv`:

| Column | Meaning |
|---|---|
| `approve` | `y` approves the row. Blank rows are left out. |
| `category` | A guess from keywords. It must be one of the civic category ids, and it is rough. |
| `text` | The sentence, quotes and spaces normalised. Don't edit the wording. |
| `flags` | `quote`: contains quoted speech. `names`: may name a person. `context`: starts with a word like "This" or "But". |
| `source_key`, `position`, `title`, `url`, `published` | Where the sentence comes from. `position` is its place among the story's sentences. |

`approve` marks `y` on every row that needs no judgement: it has a category guess, no flags, and no pronoun (he, she, it, this, …) pointing outside the sentence. You can approve more rows by hand. Approve a sentence when it:
- reads as plain civic language;
- makes sense on its own;
- names no private individual. Public officials are fine (ADR 0013).

`build` refuses the sheet if any approved row lacks a valid category, and lists every such row.

## Adding a source

Write a module beside `voa.py` that produces article records: `key`, `title`, `url`, `published`, `paragraphs`, `accepted`, `reason`, and `source` (the import file's source object, with licence and evidence). `review`, `approve` and `build` work on any source's records. Another site on VOA's platform needs only a `Site` entry in `voa.py`. Check the licence against the allowlist in ADR 0013 before writing any code.
