import pytest

from ingest.voa import credit_verdict, is_east_africa_url, parse_article, record


def page(paragraphs: list[str], headline: str = "Kenya Holds County Budget Meetings") -> str:
    body = "".join(f"<p>{p}</p>" for p in paragraphs)
    return f"""<html><head>
<script type="application/ld+json">{{"headline": "{headline}", "datePublished": "2024-05-02 10:00:00Z",
 "url": "https://learningenglish.voanews.com/a/kenya-budget/100.html"}}</script></head>
<body><div class="wsw"><div class="wsw__embed"><p>No media source currently available</p></div>{body}</div></body></html>"""


def test_parse_article_stops_at_the_sign_off_and_keeps_the_credit():
    html = page([
        "Residents of Kenya met county officials to talk about the budget.",
        "The meetings took place in every ward.",
        "I'm Jill Robbins.",
        "Jane Doe reported this story for VOA News. Jill Robbins adapted it for VOA Learning English.",
        "We want to hear from you. Write to us in the Comments section.",
        "Words in This Story",
        "budget - n. a plan for spending money",
    ])
    art = parse_article(html)
    assert art.paragraphs == [
        "Residents of Kenya met county officials to talk about the budget.",
        "The meetings took place in every ward.",
    ]
    assert art.credit == "Jane Doe reported this story for VOA News. Jill Robbins adapted it for VOA Learning English."
    assert art.title == "Kenya Holds County Budget Meetings"
    assert art.published == "2024-05-02"


def test_record_describes_the_article_as_a_public_domain_source():
    html = page(["Residents of Kenya met county officials to talk about the budget.",
                 "Jane Doe reported this story for VOA News."])
    rec = record("https://learningenglish.voanews.com/a/kenya-budget/100.html", html.encode(), "2026-10-19")
    assert rec["accepted"] is True
    assert rec["source"] == {
        "key": "voa-le-100",
        "title": "Kenya Holds County Budget Meetings",
        "origin": "VOA Learning English, published 2024-05-02. Jane Doe reported this story for VOA News.",
        "licence": "public-domain",
        "licence_url": "https://learningenglish.voanews.com/p/6021.html",
        "collection": "voa-learning-english",
        "url": "https://learningenglish.voanews.com/a/kenya-budget/100.html",
        "retrieved_at": "2026-10-19",
        "content_hash": rec["source"]["content_hash"],
        "raw_object_key": "",
    }
    assert len(rec["source"]["content_hash"]) == 64


def test_record_rejects_articles_not_about_the_launch_countries():
    html = page(["Farmers in Ghana are planting new crops this year.",
                 "Jane Doe reported this story for VOA News."], headline="Ghana Farmers Plant New Crops")
    rec = record("https://learningenglish.voanews.com/a/kenya-farm/101.html", html.encode(), "2026-10-19")
    assert (rec["accepted"], rec["reason"]) == (False, "not about the launch countries")


@pytest.mark.parametrize(
    "credit, ok",
    [
        ("Jane Doe reported this story for VOA News. Jill Robbins adapted it for VOA Learning English.", True),
        ("Jill Robbins wrote this story for VOA Learning English.", True),
        ("Jill Craig reported this story for VOANews.com. Susan Shand adapted her report for Learning English.", True),
        ("Lenny Ruvaga reported this story from Nairobi. Christopher Jones-Cruise adapted it for Learning English.", True),
        ("George Grow wrote this story for Learning English. Caty Weaver was the editor.", True),
        ("Tom Odula reported this story for the Associated Press news agency. Pete Musto adapted it for VOA Learning English.", False),
        ("Jill Robbins wrote this story for VOA Learning English. Some information came from Reuters.", False),
        ("Jill Robbins adapted this story for Learning English based on reports from AFP.", False),
        ("Jane Doe reported this story for The Conversation. Jill Robbins adapted it for VOA Learning English.", False),
        ("", False),
    ],
)
def test_credit_verdict_accepts_only_voa_produced_stories(credit, ok):
    assert credit_verdict(credit)[0] is ok


@pytest.mark.parametrize(
    "url, ok",
    [
        ("https://learningenglish.voanews.com/a/kenyans-build-sand-dams-to-keep-water/7542095.html", True),
        ("https://learningenglish.voanews.com/a/japanese-troops-arrive-in-south-sudan/3608967.html", True),
        ("https://learningenglish.voanews.com/a/women-lead-protests-against-military-rule-in-sudan/4898090.html", False),
        ("https://learningenglish.voanews.com/a/8207750.html", False),
    ],
)
def test_is_east_africa_url(url, ok):
    assert is_east_africa_url(url) is ok
