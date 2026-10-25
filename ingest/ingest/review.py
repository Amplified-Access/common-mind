"""The review sheet: candidate sentences go out as a CSV, a person approves
rows and confirms their category, and approved rows come back as Data Lab
import lines (backend/docs/data-lab.md).

An article is a dict with key, title, url, published, paragraphs, and
source: the import file's source object for that document."""

import csv
import re
from collections import Counter
from pathlib import Path
from typing import Iterable, NamedTuple

from ingest.text import CIVIC_CATEGORIES, drop_reason, flags, segment, suggest_category, unknown_names

APPROVED = {"y", "yes", "x", "1"}

# A name in at least this many stories is a public figure, place or body:
# private individuals rarely recur across the news (ADR 0013 allows public
# officials).
PUBLIC_NAME_MIN_STORIES = 3


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


def candidates(articles: Iterable[dict], dropped: Counter | None = None,
               already_seen: Iterable[str] = ()) -> list[Candidate]:
    """Splits each article into sentences and keeps the ones worth a
    reviewer's time. position counts every sentence in the article, kept or
    not, so it records the sentence's place in the document. A sentence seen
    before, in any article or in already_seen (lowercased sentences found on
    other sites, which republish each other's stories), is skipped."""
    articles = list(articles)
    public = public_names(articles)
    seen: set[str] = set(already_seen)
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
                        flags=" ".join(flags(sentence, public)), source_key=art["key"], position=position,
                        title=art["title"], url=art["url"], published=art["published"],
                    ))
                position += 1
    return out


def public_names(articles: list[dict]) -> frozenset[str]:
    """Names that appear in at least PUBLIC_NAME_MIN_STORIES articles."""
    stories: Counter[str] = Counter()
    for art in articles:
        stories.update({run for para in art["paragraphs"] for run in unknown_names(para)})
    return frozenset(run for run, n in stories.items() if n >= PUBLIC_NAME_MIN_STORIES)


_NEEDS_CONTEXT = re.compile(r"\b(he|she|him|her|his|hers|they|them|their|theirs|it|its|this|these|those)\b", re.I)


def auto_approve(rows: list[Candidate]) -> list[Candidate]:
    """Approves the rows that need no judgement: a category was suggested,
    nothing was flagged, and no pronoun points outside the sentence. Every
    other row is left as it was (ADR 0013)."""
    return [
        row._replace(approve="y")
        if row.category and not row.flags and not _NEEDS_CONTEXT.search(row.text)
        else row
        for row in rows
    ]


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
