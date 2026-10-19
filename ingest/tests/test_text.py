import pytest

from ingest.text import drop_reason, normalise, segment, suggest_category


def test_normalise_straightens_quotes_and_collapses_space():
    assert normalise("  The “clinic”  opens today , at last. It’s new ") == "The \"clinic\" opens today, at last. It's new"


@pytest.mark.parametrize(
    "sentence, reason",
    [
        ('"But now, we look at how many students were affected by the closure?', "part of a longer quote"),
        ("So we are talking six months versus two years.\"", "part of a longer quote"),
        ('Officials said, "The clinic will open on Monday for all residents."', ""),
        ("He said the plan for the county was good.", "needs the sentence before it"),
        ("Call 0722 123 456 for details about the meeting.", "contact details"),
        ("South Sudan in Focus is a joint effort of VOA and the United States Agency for International Development.", "about VOA itself"),
        ("What is going to be left for development in the county?", "a question"),
    ],
)
def test_drop_reason(sentence, reason):
    assert drop_reason(sentence) == reason


def test_segment_keeps_abbreviations_and_initials_inside_sentences():
    text = "The U.S. Agency gave $20 million to the clinic. Dr. Achieng Otieno met voters at 8 a.m. on Monday. People came early."
    assert [s for s in segment(text)] == [
        "The U.S. Agency gave $20 million to the clinic.",
        "Dr. Achieng Otieno met voters at 8 a.m. on Monday.",
        "People came early.",
    ]


@pytest.mark.parametrize(
    "text, category",
    [
        ("Voters lined up at polling stations to cast ballots in the election.", "elections"),
        ("The government will build a new road and a bridge to connect the villages.", "development"),
        ("Parents say the hospital has no medicine and nurses are on strike.", "public-services"),
        ("Police arrested the journalist and a court later released her.", "rights"),
        ("Health workers say malaria cases are rising in the refugee settlement.", "public-services"),
        ("The opposition said the presidential results were not credible.", "elections"),
        ("Lions are returning to the national park.", ""),
    ],
)
def test_suggest_category(text, category):
    assert suggest_category(text) == category
