import pytest

from ingest.text import normalise, segment, suggest_category


def test_normalise_straightens_quotes_and_collapses_space():
    assert normalise("  The “clinic”  opens today. It’s new ") == "The \"clinic\" opens today. It's new"


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
        ("Lions are returning to the national park.", ""),
    ],
)
def test_suggest_category(text, category):
    assert suggest_category(text) == category
