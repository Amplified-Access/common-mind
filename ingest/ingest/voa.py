"""VOA Learning English: finding East African stories, reading them, and
deciding whether each one is public domain.

VOA's terms make public domain only what is "produced exclusively by the
Voice of America", and forbid rewriting AP material
(https://learningenglish.voanews.com/p/6021.html). Many Learning English
stories are adaptations of wire copy, so every story is judged by its credit
line, and a story without one is left out."""

import hashlib
import json
import re
from dataclasses import dataclass, field

from bs4 import BeautifulSoup

from ingest import http
from ingest.text import normalise

BASE = "https://learningenglish.voanews.com"
SITEMAP_INDEX = f"{BASE}/sitemap.xml"
TERMS_URL = f"{BASE}/p/6021.html"
COLLECTION = "voa-learning-english"

# Slug words naming a launch country or one of its cities. "sudan" alone is
# Sudan, which is not a launch country.
_SLUG_TERMS = [
    "kenya", "kenyan", "kenyans", "uganda", "ugandan", "ugandans", "tanzania", "tanzanian", "tanzanians",
    "rwanda", "rwandan", "rwandans", "ethiopia", "ethiopian", "ethiopians", "south-sudan", "south-sudanese",
    "nairobi", "mombasa", "kisumu", "kampala", "kigali", "juba", "dodoma", "dar-es-salaam", "addis-ababa",
    "east-africa", "east-african",
]
_COUNTRY_TEXT = re.compile(
    r"\b(Kenyan?s?|Ugandan?s?|Tanzanian?s?|Rwandan?s?|Ethiopian?s?|South Sudan(ese)?|Nairobi|Kampala|Kigali|Juba|"
    r"Dodoma|Dar es Salaam|Addis Ababa)\b"
)


def is_east_africa_url(url: str) -> bool:
    """Whether a story URL's slug names a launch country. ID-only URLs carry
    no slug and are not matched."""
    m = re.search(r"/a/([^/]+)/\d+\.html$", url)
    if not m:
        return False
    slug = f"-{m.group(1).lower()}-"
    return any(f"-{term}-" in slug for term in _SLUG_TERMS)


def discover() -> list[str]:
    """Story URLs from the site's sitemaps whose slug names a launch country.
    The site search is closed to robots, so the sitemaps are the index."""
    index = http.get(SITEMAP_INDEX).decode("utf-8")
    urls: list[str] = []
    for sitemap in re.findall(r"<loc>([^<]+)</loc>", index):
        if not re.search(r"sitemap_\d+_(\d+|latest)\.xml", sitemap):
            continue  # news, sections and videos repeat or aren't stories
        body = http.get(sitemap).decode("utf-8")
        urls += [u for u in re.findall(r"<loc>([^<]+)</loc>", body) if is_east_africa_url(u)]
    return sorted(set(urls))


@dataclass
class Article:
    title: str = ""
    published: str = ""
    url: str = ""
    paragraphs: list[str] = field(default_factory=list)
    credit: str = ""


_SIGN_OFF = re.compile(r"^I'?m [A-Z][\w.'-]*(?: [A-Z][\w.'-]*)*\.?$")
_END_OF_STORY = re.compile(r"^(We want to hear from you|Words in This Story|_{5,})")
_CREDIT = re.compile(
    r"\b(reported|wrote|written|adapted|produced)\b[^.]*\b(this|the) (story|report)\b"
    r"|\badapted it\b|\bcontributed to this (story|report)\b|\binformation (for this (story|report) )?came from\b",
    re.I,
)


def parse_article(html: str) -> Article:
    soup = BeautifulSoup(html, "html.parser")
    art = Article()
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            meta = json.loads(script.string or "")
        except json.JSONDecodeError:
            continue
        if isinstance(meta, dict) and meta.get("headline"):
            art.title = normalise(meta["headline"])
            art.published = str(meta.get("datePublished", ""))[:10]
            art.url = meta.get("url", "")
            break

    body = soup.select_one("div.wsw")
    if body is None:
        return art
    for embed in body.select(".wsw__embed"):
        embed.decompose()

    # The story ends at the reporter's sign-off, the credit line or the
    # glossary; only credit lines are read after that. Subheads are skipped.
    ended = False
    credits = []
    for el in body.find_all(["p", "h2", "h3"]):
        text = normalise(el.get_text(" "))
        if not text:
            continue
        if _SIGN_OFF.match(text) or _END_OF_STORY.match(text):
            ended = True
        elif _CREDIT.search(text):
            credits.append(text)
            ended = True
        elif el.name == "p" and not ended:
            art.paragraphs.append(text)
    art.credit = " ".join(credits)
    return art


_WIRE = re.compile(r"Associated Press|\bAP\b|Reuters|Agence France-Presse|\bAFP\b")
_REPORTED_FOR = re.compile(r"\b(?:reported|wrote|written|produced)\s+(?:this|the)\s+(?:story|report)\s+for\s+([^.]+)", re.I)
_ADAPTED_FROM = re.compile(r"\badapted\b[^.]*?\bfrom\s+([^.]+)", re.I)
# VOA, VOA's, VOANews.com, and Learning English, which is VOA's own service.
_VOA = re.compile(r"\bVOA|Voice of America|\bLearning English\b")


def credit_verdict(credit: str) -> tuple[bool, str]:
    """Whether a story's credit line shows VOA produced it, and why not."""
    if not credit:
        return False, "no credit line"
    if m := _WIRE.search(credit):
        return False, f"wire service ({m.group(0)})"
    for rx, verb in ((_REPORTED_FOR, "reported for"), (_ADAPTED_FROM, "adapted from")):
        for target in rx.findall(credit):
            if not _VOA.search(target):
                return False, f"{verb} {target.strip()}"
    if not _VOA.search(credit):
        return False, "credit line does not name VOA"
    return True, ""


def article_id(url: str) -> str:
    return re.search(r"/(\d+)\.html$", url).group(1)


def record(url: str, raw: bytes, retrieved_at: str) -> dict:
    """An article as the review step reads it, with its verdict and the
    import source it becomes."""
    art = parse_article(raw.decode("utf-8", errors="replace"))
    url = art.url or url
    key = f"voa-le-{article_id(url)}"
    ok, reason = credit_verdict(art.credit)
    if ok and not _COUNTRY_TEXT.search(" ".join([art.title, *art.paragraphs])):
        ok, reason = False, "not about the launch countries"
    return {
        "key": key,
        "url": url,
        "title": art.title,
        "published": art.published,
        "credit": art.credit,
        "accepted": ok,
        "reason": reason,
        "paragraphs": art.paragraphs,
        "source": {
            "key": key,
            "title": art.title,
            "origin": f"VOA Learning English, published {art.published}. {art.credit}",
            "licence": "public-domain",
            "licence_url": TERMS_URL,
            "collection": COLLECTION,
            "url": url,
            "retrieved_at": retrieved_at,
            "content_hash": hashlib.sha256(raw).hexdigest(),
            "raw_object_key": "",
        },
    }
