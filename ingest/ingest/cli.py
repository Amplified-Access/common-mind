"""ingest: from openly licensed documents to a Data Lab import file.

    uv run ingest discover --site voa-af   # story URLs from the sitemaps
    uv run ingest fetch --site voa-af      # download, parse and judge each story
    uv run ingest review --site voa-af     # candidate sentences -> review sheet
    uv run ingest approve --site voa-af    # approve the rows that need no judgement
    uv run ingest build --site voa-af      # approved rows -> import file

Sites: voa-le (VOA Learning English), voa-af (VOA Africa). Each site's
files live in data/<site>/ and its fetched pages in data/raw/<site>/.
"""

import argparse
import datetime
import json
import sys
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from ingest import http, voa
from ingest.review import auto_approve, build_rows, candidates, read_review, write_review
from ingest.text import civic_score

# An article needs at least this many civic keyword stems to be reviewed.
MIN_ARTICLE_CIVIC_SCORE = 3
FETCH_WORKERS = 4


def data_dir(args: argparse.Namespace) -> Path:
    return Path("data") / args.site


def discover(args: argparse.Namespace) -> None:
    out = data_dir(args) / "urls.txt"
    urls = voa.discover(voa.SITES[args.site])
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(urls) + "\n")
    print(f"{len(urls)} story URLs name a launch country -> {out}")


def fetch(args: argparse.Namespace) -> None:
    site = voa.SITES[args.site]
    urls = [u for u in (data_dir(args) / "urls.txt").read_text().split() if u][: args.limit or None]
    raw_dir = Path("data/raw") / site.name

    def one(url: str) -> dict | None:
        path = raw_dir / f"{voa.article_id(url)}.html"
        try:
            raw = http.get_cached(url, path)
        except OSError as err:
            print(f"skip {url}: {err}", file=sys.stderr)
            return None
        fetched = datetime.datetime.fromtimestamp(path.stat().st_mtime, datetime.UTC).date().isoformat()
        return voa.record(url, raw, fetched, site)

    verdicts: Counter[str] = Counter()
    out = data_dir(args) / "articles.jsonl"
    with out.open("w", encoding="utf-8") as f, ThreadPoolExecutor(FETCH_WORKERS) as pool:
        for n, rec in enumerate(pool.map(one, urls), 1):
            if rec is None:
                verdicts["fetch failed"] += 1
                continue
            verdicts[rec["reason"] or "accepted"] += 1
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            if n % 100 == 0:
                print(f"{n}/{len(urls)}", file=sys.stderr, flush=True)
    print(f"{len(urls)} stories -> {out}")
    for reason, count in verdicts.most_common(15):
        print(f"  {count:5}  {reason}")


def review(args: argparse.Namespace) -> None:
    articles = [json.loads(line) for line in (data_dir(args) / "articles.jsonl").open(encoding="utf-8")]
    accepted = [a for a in articles if a["accepted"]]
    scored = sorted(
        ((sum(1 for s in civic_score(" ".join([a["title"], *a["paragraphs"]])).values() if s), a) for a in accepted),
        key=lambda pair: -pair[0],
    )
    civic = [a for score, a in scored if score >= MIN_ARTICLE_CIVIC_SCORE]
    dropped: Counter[str] = Counter()
    rows = candidates(civic, dropped)
    out = data_dir(args) / "review.csv"
    write_review(rows, out)
    print(f"{len(accepted)} of {len(articles)} stories are VOA-produced; {len(civic)} are civic enough to review")
    print(f"{len(rows)} candidate sentences -> {out}")
    for reason, count in dropped.most_common():
        print(f"  dropped {count:5}  {reason}")


def approve(args: argparse.Namespace) -> None:
    sheet = data_dir(args) / "review.csv"
    rows = read_review(sheet)
    before = sum(1 for r in rows if r.approve.strip())
    rows = auto_approve(rows)
    write_review(rows, sheet)
    after = sum(1 for r in rows if r.approve.strip())
    print(f"approved {after - before} more rows ({after} of {len(rows)} now approved) in {sheet}")


def build(args: argparse.Namespace) -> None:
    sheet = data_dir(args) / "review.csv"
    articles = {a["key"]: a for a in map(json.loads, (data_dir(args) / "articles.jsonl").open(encoding="utf-8"))}
    try:
        lines = build_rows(read_review(sheet), articles)
    except ValueError as err:
        sys.exit(f"{sheet} has problems:\n{err}")
    out = data_dir(args) / "items.jsonl"
    with out.open("w", encoding="utf-8") as f:
        for line in lines:
            f.write(json.dumps(line, ensure_ascii=False) + "\n")
    print(f"{len(lines)} approved sentences from {len({l['source']['key'] for l in lines})} stories -> {out}")
    print(f"Next: cd ../backend && make datalab-check file={out.resolve()}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="ingest", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(required=True)
    for name, run, help_text in [
        ("discover", discover, "list a site's stories about the launch countries"),
        ("fetch", fetch, "download and judge each story (cached in data/raw)"),
        ("review", review, "write the review sheet of candidate sentences"),
        ("approve", approve, "approve the rows that need no judgement (ADR 0013 rules)"),
        ("build", build, "turn approved review rows into a Data Lab import file"),
    ]:
        p = sub.add_parser(name, help=help_text)
        p.add_argument("--site", choices=sorted(voa.SITES), default="voa-le")
        if name == "fetch":
            p.add_argument("--limit", type=int, default=0, help="fetch only the first N stories")
        p.set_defaults(run=run)
    args = parser.parse_args()
    args.run(args)


if __name__ == "__main__":
    main()
