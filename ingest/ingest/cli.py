"""ingest: from openly licensed documents to a Data Lab import file.

    uv run ingest voa-discover     # story URLs from the sitemaps
    uv run ingest voa-fetch        # download, parse and judge each story
    uv run ingest review           # candidate sentences -> review sheet
    (approve rows in data/voa/review.csv)
    uv run ingest build            # approved rows -> import file
"""

import argparse
import datetime
import json
import sys
from collections import Counter
from pathlib import Path

from ingest import http, voa
from ingest.review import build_rows, candidates, read_review, write_review
from ingest.text import civic_score

DATA = Path("data/voa")
RAW = Path("data/raw/voa-le")

# An article needs at least this many civic keyword stems to be reviewed.
MIN_ARTICLE_CIVIC_SCORE = 3


def voa_discover(args: argparse.Namespace) -> None:
    urls = voa.discover()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text("\n".join(urls) + "\n")
    print(f"{len(urls)} story URLs name a launch country -> {args.out}")


def voa_fetch(args: argparse.Namespace) -> None:
    urls = [u for u in args.urls.read_text().split() if u][: args.limit or None]
    verdicts: Counter[str] = Counter()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as out:
        for n, url in enumerate(urls, 1):
            path = RAW / f"{voa.article_id(url)}.html"
            try:
                raw = http.get_cached(url, path)
            except OSError as err:
                print(f"skip {url}: {err}", file=sys.stderr)
                verdicts["fetch failed"] += 1
                continue
            fetched = datetime.datetime.fromtimestamp(path.stat().st_mtime, datetime.UTC).date().isoformat()
            rec = voa.record(url, raw, fetched)
            verdicts[rec["reason"] or "accepted"] += 1
            out.write(json.dumps(rec, ensure_ascii=False) + "\n")
            if n % 25 == 0:
                print(f"{n}/{len(urls)}", file=sys.stderr)
    print(f"{len(urls)} stories -> {args.out}")
    for reason, count in verdicts.most_common():
        print(f"  {count:5}  {reason}")


def review(args: argparse.Namespace) -> None:
    articles = [json.loads(line) for line in args.articles.open(encoding="utf-8")]
    accepted = [a for a in articles if a["accepted"]]
    scored = sorted(
        ((sum(1 for s in civic_score(" ".join([a["title"], *a["paragraphs"]])).values() if s), a) for a in accepted),
        key=lambda pair: -pair[0],
    )
    civic = [a for score, a in scored if score >= MIN_ARTICLE_CIVIC_SCORE]
    dropped: Counter[str] = Counter()
    rows = candidates(civic, dropped)
    write_review(rows, args.out)
    print(f"{len(accepted)} of {len(articles)} stories are VOA-produced; {len(civic)} are civic enough to review")
    print(f"{len(rows)} candidate sentences -> {args.out}")
    for reason, count in dropped.most_common():
        print(f"  dropped {count:5}  {reason}")
    print("Approve a row by putting y in its approve column, and fix its category if the guess is wrong.")


def build(args: argparse.Namespace) -> None:
    articles = {a["key"]: a for a in map(json.loads, args.articles.open(encoding="utf-8"))}
    try:
        lines = build_rows(read_review(args.review), articles)
    except ValueError as err:
        sys.exit(f"{args.review} has problems:\n{err}")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as out:
        for line in lines:
            out.write(json.dumps(line, ensure_ascii=False) + "\n")
    print(f"{len(lines)} approved sentences from {len({l['source']['key'] for l in lines})} stories -> {args.out}")
    print(f"Next: cd ../backend && make datalab-check file={args.out.resolve()}")


def main() -> None:
    parser = argparse.ArgumentParser(prog="ingest", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(required=True)

    p = sub.add_parser("voa-discover", help="list VOA Learning English stories about the launch countries")
    p.add_argument("--out", type=Path, default=DATA / "urls.txt")
    p.set_defaults(run=voa_discover)

    p = sub.add_parser("voa-fetch", help="download and judge each story (cached in data/raw)")
    p.add_argument("--urls", type=Path, default=DATA / "urls.txt")
    p.add_argument("--out", type=Path, default=DATA / "articles.jsonl")
    p.add_argument("--limit", type=int, default=0, help="fetch only the first N stories")
    p.set_defaults(run=voa_fetch)

    p = sub.add_parser("review", help="write the review sheet of candidate sentences")
    p.add_argument("--articles", type=Path, default=DATA / "articles.jsonl")
    p.add_argument("--out", type=Path, default=DATA / "review.csv")
    p.set_defaults(run=review)

    p = sub.add_parser("build", help="turn approved review rows into a Data Lab import file")
    p.add_argument("--review", type=Path, default=DATA / "review.csv")
    p.add_argument("--articles", type=Path, default=DATA / "articles.jsonl")
    p.add_argument("--out", type=Path, default=DATA / "items.jsonl")
    p.set_defaults(run=build)

    args = parser.parse_args()
    args.run(args)


if __name__ == "__main__":
    main()
