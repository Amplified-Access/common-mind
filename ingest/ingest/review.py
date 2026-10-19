"""The review sheet: candidate sentences go out as a CSV, a person approves
rows and confirms their category, and approved rows come back as Data Lab
import lines (backend/docs/data-lab.md).

An article is a dict with key, title, url, published, paragraphs, and
source: the import file's source object for that document."""

import csv
from collections import Counter
from pathlib import Path
from typing import Iterable, NamedTuple

from ingest.text import CIVIC_CATEGORIES, drop_reason, flags, segment, suggest_category

APPROVED = {"y", "yes", "x", "1"}


class Candidate(NamedTuple):
    approve: str
    category: str
    text: str
    flags: str
    source_key: str
    position: int
    title: str
    url: str
    published: str


def candidates(articles: Iterable[dict], dropped: Counter | None = None) -> list[Candidate]:
    """Splits each article into sentences and keeps the ones worth a
    reviewer's time. position counts every sentence in the article, kept or
    not, so it records the sentence's place in the document. A sentence seen
    before, in any article, is skipped."""
    seen: set[str] = set()
    out = []
    for art in articles:
        position = 0
        for para in art["paragraphs"]:
            for sentence in segment(para):
                reason = drop_reason(sentence) or ("duplicate" if sentence.lower() in seen else "")
                if reason:
                    if dropped is not None:
                        dropped[reason] += 1
                else:
                    seen.add(sentence.lower())
                    out.append(Candidate(
                        approve="", category=suggest_category(sentence), text=sentence,
                        flags=" ".join(flags(sentence)), source_key=art["key"], position=position,
                        title=art["title"], url=art["url"], published=art["published"],
                    ))
                position += 1
    return out


def write_review(rows: Iterable[Candidate], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(Candidate._fields)
        w.writerows(rows)


def read_review(path: Path) -> list[Candidate]:
    with path.open(newline="", encoding="utf-8") as f:
        return [Candidate(**{**r, "position": int(r["position"])}) for r in csv.DictReader(f)]


def build_rows(rows: list[Candidate], articles: dict[str, dict]) -> list[dict]:
    """Turns approved review rows into import lines. Every problem is reported
    at once, by its line in the sheet (the header is row 1)."""
    out, problems = [], []
    for n, row in enumerate(rows, start=2):
        if row.approve.strip().lower() not in APPROVED:
            continue
        category = row.category.strip()
        if category not in CIVIC_CATEGORIES:
            problems.append(f"row {n}: approved without a civic category" if not category
                            else f"row {n}: {category!r} is not a civic category")
            continue
        art = articles.get(row.source_key)
        if art is None:
            problems.append(f"row {n}: source {row.source_key!r} is not in the articles file")
            continue
        out.append({
            "source": art["source"],
            "kind": "translate",
            "language": "en",
            "category": category,
            "text": row.text,
            "position": row.position,
        })
    if problems:
        raise ValueError("\n".join(problems))
    return out
