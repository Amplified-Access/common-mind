"""Voice of America sites: finding East African stories, reading them, and
deciding whether each one is public domain.

VOA's terms make public domain only what is "produced exclusively by the
Voice of America", and keep AP, Reuters and AFP material copyrighted
(https://learningenglish.voanews.com/p/6021.html,
https://www.voaafrica.com/p/8177.html). Both sites carry wire copy, so every
story is judged: Learning English by its credit line, which names who
reported the story and for whom, and VOA Africa by its byline, which names
the agency on wire stories. A story that can't be judged is left out."""

import hashlib
import json
import re
from dataclasses import dataclass, field

from bs4 import BeautifulSoup

from ingest import http
from ingest.text import normalise


@dataclass(frozen=True)
class Site:
    name: str          # used for data directories and on the command line
    base: str
    sitemap_prefix: str
    collection: str
    label: str         # how the source's origin names the site
    terms_url: str
    key_prefix: str
    judge_by: str      # "credit" (Learning English) or "byline" (news sites)


SITES = {
    "voa-le": Site("voa-le", "https://learningenglish.voanews.com", "sitemap_428_", "voa-learning-english",
                   "VOA Learning English", "https://learningenglish.voanews.com/p/6021.html", "voa-le-", "credit"),
    # Story ids are unique across VOA's sites, so news-site keys need no site
    # prefix. A story republished on another site gets a new id; review skips
    # its sentences as duplicates.
    "voa-af": Site("voa-af", "https://www.voaafrica.com", "sitemap_463_", "voa-africa",
                   "VOA Africa", "https://www.voaafrica.com/p/8177.html", "voa-", "byline"),
    "voa-news": Site("voa-news", "https://www.voanews.com", "sitemap_415_", "voa-news",
                     "VOA News", "https://www.voanews.com/p/5338.html", "voa-", "byline"),
}

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


def discover(site: Site) -> list[str]:
    """Story URLs from a site's sitemaps whose slug names a launch country.
    Site search is closed to robots, so the sitemaps are the index."""
    index = http.get(f"{site.base}/sitemap.xml").decode("utf-8")
    pattern = re.compile(re.escape(site.sitemap_prefix) + r"(\d+|latest)\.xml")
    urls: list[str] = []
    for sitemap in re.findall(r"<loc>([^<]+)</loc>", index):
        if not pattern.search(sitemap):
            continue  # news, sections and videos repeat or aren't stories
        body = http.get(sitemap).decode("utf-8")
        urls += [u for u in re.findall(r"<loc>([^<]+)</loc>", body) if is_east_africa_url(u)]
    return sorted(set(urls))


@dataclass
class Article:
    title: str = ""
    published: str = ""
    url: str = ""
    byline: str = ""
    paragraphs: list[str] = field(default_factory=list)
    credit: str = ""


_SIGN_OFF = re.compile(r"^I'?m [A-Z][\w.'-]*(?: [A-Z][\w.'-]*)*\.?$")
_END_OF_STORY = re.compile(r"^(We want to hear from you|Words in This Story|_{5,})")
_CREDIT = re.compile(
    r"\b(reported|wrote|written|adapted|produced)\b[^.]*\b(this|the) (story|report)\b"
    r"|\badapted it\b|\bcontributed to this (story|report)\b|\binformation\b[^.]*\bcame from\b",
    re.I,
)
_DATELINE = re.compile(r"^[A-Z][A-Z .,'-]+ — ")


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
            author = meta.get("author")
            if isinstance(author, list):
                author = author[0] if author else {}
            if isinstance(author, dict):
                art.byline = normalise(author.get("name", ""))
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
            art.paragraphs.append(_DATELINE.sub("", text) if not art.paragraphs else text)
    art.credit = " ".join(credits)
    return art


_WIRE = re.compile(r"Associated Press|\bAP\b|Reuters|Agence France-Presse|\bAFP\b")
_REPORTED_FOR = re.compile(r"\b(?:reported|wrote|written|produced)\s+(?:this|the)\s+(?:story|report)\s+for\s+([^.]+)", re.I)
_ADAPTED_FROM = re.compile(r"\badapted\b[^.]*?\bfrom\s+([^.]+)", re.I)
# VOA, VOA's, VOANews.com, and Learning English, which is VOA's own service.
_VOA = re.compile(r"\bVOA|Voice of America|\bLearning English\b")
# Bylines naming an organisation other than VOA.
_ORGANISATION = re.compile(r"\b(Press|Agence|Agency|News|Conversation|Foundation|Times|Post|Network|Institute)\b")


def credit_verdict(credit: str) -> tuple[bool, str]:
    """Whether a Learning English credit line shows VOA produced the story."""
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


def byline_verdict(byline: str, credit: str) -> tuple[bool, str]:
    """Whether a news story's byline is VOA staff, with no wire material
    acknowledged in the text."""
    if not byline:
        return False, "no byline"
    if m := _WIRE.search(byline) or _WIRE.search(credit):
        return False, f"wire service ({m.group(0)})"
    if not _VOA.search(byline) and _ORGANISATION.search(byline):
        return False, f"byline is {byline}"
    return True, ""


def article_id(url: str) -> str:
    return re.search(r"/(\d+)\.html$", url).group(1)


def record(url: str, raw: bytes, retrieved_at: str, site: Site) -> dict:
    """An article as the review step reads it, with its verdict and the
    import source it becomes."""
    art = parse_article(raw.decode("utf-8", errors="replace"))
    url = art.url or url
    key = f"{site.key_prefix}{article_id(url)}"
    if site.judge_by == "credit":
        ok, reason = credit_verdict(art.credit)
        attribution = art.credit
    else:
        ok, reason = byline_verdict(art.byline, art.credit)
        attribution = f"By {art.byline}." + (f" {art.credit}" if art.credit else "")
    if ok and not art.paragraphs:
        ok, reason = False, "no story text"
    if ok and not _COUNTRY_TEXT.search(" ".join([art.title, *art.paragraphs])):
        ok, reason = False, "not about the launch countries"
    return {
        "key": key,
        "url": url,
        "title": art.title,
        "published": art.published,
        "credit": attribution,
        "accepted": ok,
        "reason": reason,
        "paragraphs": art.paragraphs,
        "source": {
            "key": key,
            "title": art.title,
            "origin": f"{site.label}, published {art.published}. {attribution}",
            "licence": "public-domain",
            "licence_url": site.terms_url,
            "collection": site.collection,
            "url": url,
            "retrieved_at": retrieved_at,
            "content_hash": hashlib.sha256(raw).hexdigest(),
            "raw_object_key": "",
        },
    }
