"""Source-agnostic text handling: normalising, sentence splitting, the
filters that decide what a reviewer sees, and a first guess at the civic
category. Every guess here is confirmed by a person before import (ADR 0013)."""

import re
import unicodedata

# The ids in backend/internal/domain/datalab.go CivicCategories.
CIVIC_CATEGORIES = [
    "community-problems", "public-services", "local-government", "elections",
    "accountability", "priorities", "rights", "public-meetings", "promises",
    "development", "feedback",
]

MIN_WORDS = 5
MAX_WORDS = 40

_QUOTES = str.maketrans({"“": '"', "”": '"', "‘": "'", "’": "'", " ": " "})


def normalise(text: str) -> str:
    text = unicodedata.normalize("NFC", text).translate(_QUOTES)
    text = re.sub(r"\s+", " ", text)
    # Joining inline tags leaves a space before punctuation: "expensive , which".
    return re.sub(r" ([,;:!?](?:\s|$)|\.(?:\s|$))", r"\1", text).strip()


# Words that end in a full stop without ending the sentence.
_ABBREVIATIONS = {
    "mr", "mrs", "ms", "dr", "prof", "gen", "sen", "rep", "gov", "lt", "col", "capt", "sgt",
    "st", "no", "jan", "feb", "mar", "apr", "aug", "sep", "sept", "oct", "nov", "dec",
    "inc", "ltd", "co", "jr", "sr", "vs", "mt", "ft",
}
_BOUNDARY = re.compile(r"""[.!?]["')\]]*\s+(?=["'(\[]?[A-Z0-9])""")
_DOTTED = re.compile(r"(?:\b[A-Za-z]\.)+$")  # U.S., a.m., single initials


def segment(text: str) -> list[str]:
    """Splits a paragraph into sentences."""
    text = normalise(text)
    out, start = [], 0
    for m in _BOUNDARY.finditer(text):
        before = text[start:m.start() + 1]
        word = re.search(r"(\S+)$", before).group(1)
        if text[m.start()] == "." and (_DOTTED.search(word) or word[:-1].lower().strip("\"'(") in _ABBREVIATIONS):
            continue
        out.append(text[start:m.end()].strip())
        start = m.end()
    if text[start:].strip():
        out.append(text[start:].strip())
    return out


_CONTACT = re.compile(r"\S+@\S+\.\w+|https?://|www\.|\+?\d[\d ()-]{7,}\d")
_PRONOUN_LED = {"he", "she", "they", "his", "her", "their", "it", "its", "him", "them"}
_CONTEXT_LED = {"this", "that", "these", "those", "but", "and", "however", "also", "instead", "still", "so", "then", "yet"}

# Capitalised words that are places, bodies or calendar words, never a person.
_KNOWN = set("""
The A An In On At For Of And To By From With
Kenya Kenyan Kenyans Uganda Ugandan Ugandans Tanzania Tanzanian Tanzanians Rwanda Rwandan Rwandans
Ethiopia Ethiopian Ethiopians Sudan Sudanese South North East West Central Eastern Western Southern Northern
Africa African Africans Nairobi Mombasa Kisumu Nakuru Kampala Gulu Dodoma Dar Salaam Kigali Addis Ababa Juba
Tigray Oromia Amhara Lake Victoria Rift Valley Great Lakes Horn Somalia Somali
United States Nations Kingdom America American Americans Europe European Union China Chinese
World Bank Health Organization International Monetary Fund Red Cross Learning English VOA News Voice
President Vice Prime Minister Ministry Minister Parliament National Assembly Senate County Counties Government
Independent Electoral Boundaries Commission Court Supreme High Constitution Police Army Agency Development
Department State Foundation Council Committee Program Programme Office Board Authority Fund Organisation
Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August
September October November December Christian Christians Muslim Muslims Catholic Church Islamic
""".split())
_CAPITALISED_RUN = re.compile(r"\b[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)+")


def _first_word(sentence: str) -> str:
    m = re.match(r"""["'(\s]*([A-Za-z']+)""", sentence)
    return m.group(1).lower() if m else ""


def drop_reason(sentence: str) -> str:
    """Why a sentence is left out of review, or '' when it is kept."""
    words = sentence.split()
    if len(words) < MIN_WORDS:
        return "too short"
    if len(words) > MAX_WORDS:
        return "too long"
    if _CONTACT.search(sentence):
        return "contact details"
    if sentence.count('"') % 2:
        return "part of a longer quote"
    if re.search(r"\bVOA|Voice of America", sentence):
        return "about VOA itself"
    if sentence.rstrip("\"')").endswith("?"):
        return "a question"
    if _first_word(sentence) in _PRONOUN_LED:
        return "needs the sentence before it"
    alnum = [c for c in sentence if c.isalnum()]
    if sum(c.isdigit() for c in alnum) > 0.3 * len(alnum):
        return "mostly numbers"
    return ""


def flags(sentence: str) -> list[str]:
    """Things the reviewer should look at before approving."""
    out = []
    if '"' in sentence:
        out.append("quote")
    if _first_word(sentence) in _CONTEXT_LED:
        out.append("context")
    for run in _CAPITALISED_RUN.findall(sentence):
        if not all(w in _KNOWN for w in run.split()):
            out.append("names")
            break
    return out


# Word stems per category. A stem with a space is a phrase and counts twice.
_KEYWORDS = {
    "elections": ["election", "elected", "electoral", "vote", "voter", "voting", "ballot", "polling", "candidate",
                  "campaign", "referendum", "opposition", "presidential", "polls", "re-elect", "political part"],
    "public-services": ["hospital", "clinic", "health", "school", "teacher", "nurse", "doctor", "medic",
                        "patient", "vaccin", "water supply", "electricity", "public service", "malaria", "cholera",
                        "ebola", "hiv", "disease", "student", "pupil", "universit", "education", "clean water",
                        "food aid", "transport"],
    "local-government": ["county government", "local government", "district", "council", "governor", "mayor",
                         "municipal", "sub-county", "ward", "minister", "ministry", "parliament", "lawmaker",
                         "authorities", "officials"],
    "accountability": ["corrupt", "audit", "bribe", "ombudsman", "misuse", "accountab", "transparen", "embezzl",
                       "fraud", "scandal", "investigat", "inquiry", "probe", "watchdog", "stolen", "theft"],
    "priorities": ["budget", "priorit", "spending", "allocat", "tax"],
    "rights": ["right", "freedom", "protest", "arrest", "discriminat", "equal", "justice", "police", "court",
               "judge", "journalist", "detain", "jail", "prison", "activist", "torture", "abuse", "censor",
               "women and girls", "press freedom"],
    "public-meetings": ["public meeting", "baraza", "hearing", "town hall", "forum", "public participation",
                        "consult", "summit", "dialogue", "talks"],
    "promises": ["promise", "pledge", "commitment", "committed to", "manifesto", "vow", "peace deal", "agreement"],
    "development": ["build", "construct", "road", "bridge", "project", "infrastructure", "develop", "irrigation",
                    "econom", "invest", "farm", "agricultur", "crop", "jobs", "business", "trade", "railway",
                    "energy", "solar", "technolog", "loan"],
    "community-problems": ["drought", "flood", "shortage", "hunger", "famine", "crime", "insecurity", "garbage",
                           "waste", "unemploy", "pollution", "displaced", "refugee", "attack", "violence",
                           "militant", "al-shabab", "fighting", "conflict", "poverty", "prices", "inflation",
                           "locust", "landslide", "disaster", "evict", "kidnap", "climate"],
    "feedback": ["complain", "feedback", "petition", "hotline", "suggestion", "report problems", "survey"],
}
_PATTERNS = {cat: [(re.compile(r"\b" + re.escape(k)), 2 if " " in k else 1) for k in ks] for cat, ks in _KEYWORDS.items()}


def civic_score(text: str) -> dict[str, int]:
    low = text.lower()
    return {cat: sum(w for p, w in pats if p.search(low)) for cat, pats in _PATTERNS.items()}


def suggest_category(text: str) -> str:
    """The best-scoring civic category, or '' when nothing matches."""
    scores = civic_score(text)
    best = max(scores, key=lambda c: scores[c])
    return best if scores[best] > 0 else ""
