import pytest

from ingest.review import Candidate, auto_approve, build_rows, candidates, read_review, write_review

ARTICLE = {
    "key": "voa-le-100",
    "url": "https://learningenglish.voanews.com/a/100.html",
    "title": "Kenyan Counties Ask Residents About Budgets",
    "published": "2024-05-02",
    "source": {"key": "voa-le-100", "title": "Kenyan Counties Ask Residents About Budgets", "licence": "public-domain"},
    "paragraphs": [
        "County officials in Kenya held public meetings so residents could choose which projects the budget should pay for.",
        "He said the plan was good.",
        "Call 0722 123 456 or write to info@example.org for details about the county budget meetings.",
        "Kenya",
        "County officials in Kenya held public meetings so residents could choose which projects the budget should pay for.",
    ],
}


def test_candidates_drop_short_pronoun_led_contact_and_duplicate_sentences():
    out = candidates([ARTICLE])
    assert [c.text for c in out] == [
        "County officials in Kenya held public meetings so residents could choose which projects the budget should pay for."
    ]
    assert out[0].position == 0
    assert out[0].category == "public-meetings"


def test_a_name_in_several_stories_is_public_and_not_flagged():
    sentence = "Riek Machar returned to the capital for talks on the peace deal with the government."
    stories = [dict(ARTICLE, key=f"voa-{n}", paragraphs=[sentence if n == 0 else f"Riek Machar met officials in town number {n} today."])
               for n in range(3)]
    assert candidates(stories)[0].flags == ""
    assert candidates(stories[:2])[0].flags == "names"


def test_candidates_flag_quotes_and_names():
    art = dict(ARTICLE, paragraphs=['Mary Wanjiku said, "We need the county to fix the road to the market before the rains."'])
    (c,) = candidates([art])
    assert set(c.flags.split()) == {"quote", "names"}


@pytest.mark.parametrize(
    "category, flags, text, approved",
    [
        ("public-services", "", "The clinic in the town will open every day from eight in the morning.", True),
        ("", "", "The clinic in the town will open every day from eight in the morning.", False),
        ("public-services", "names", "Mary Wanjiku opened the clinic in the town last year.", False),
        ("public-services", "", "Officials said the clinic would serve him and other residents of the town.", False),
        ("development", "", "Residents say this road has been closed since the rains began in March.", False),
    ],
)
def test_auto_approve_takes_only_categorised_unflagged_self_contained_rows(category, flags, text, approved):
    row = Candidate("", category, text, flags, "voa-le-100", 0, "", "", "")
    assert auto_approve([row])[0].approve == ("y" if approved else "")


def test_build_rows_keeps_only_approved_rows_with_a_civic_category(tmp_path):
    rows = [
        Candidate("y", "public-meetings", "Residents met county officials to discuss the budget for new roads.", "", "voa-le-100", 0, "", "", ""),
        Candidate("", "public-meetings", "Residents asked for a new market in the ward this year.", "", "voa-le-100", 1, "", "", ""),
        Candidate("Y", "", "Officials said the clinic would open next month in the town.", "", "voa-le-100", 2, "", "", ""),
    ]
    sheet = tmp_path / "review.csv"
    write_review(rows, sheet)
    with pytest.raises(ValueError, match="row 4: approved without a civic category"):
        build_rows(read_review(sheet), {"voa-le-100": ARTICLE})

    rows[2] = rows[2]._replace(approve="")
    write_review(rows, sheet)
    (line,) = build_rows(read_review(sheet), {"voa-le-100": ARTICLE})
    assert line == {
        "source": ARTICLE["source"],
        "kind": "translate",
        "language": "en",
        "category": "public-meetings",
        "text": "Residents met county officials to discuss the budget for new roads.",
        "position": 0,
    }
