# ADR 0010 — The Data Lab: a human-only platform for civic language data

**Status:** Accepted  
**Date:** 2026-10-14

## Context

The published CommonMind models were trained on existing public datasets (Rogendo, MAFAND-MT, Inkuba, SALT and others). The next step is a Civic Corpus of new, clean civic language data in African languages, written and checked by native speakers. That needs a platform for translation, annotation, and verification that adds each verified row to the corpus as soon as it passes review.

Drafting translations with the existing models would be faster, but it would feed the models' own output, and the datasets behind them, back into a corpus meant to be new.

## Decision

Build the **Data Lab**, CommonMind's volunteer platform at `/data-lab`, backed by `backend/`, in which every row is produced by a person. The Civic Corpus is its first dataset; the name leaves room for the others built there later. `/research/civic-corpus` explains the corpus and links to the Data Lab.

- **No model in the loop.** The Data Lab does not call the inference server. Model assistance may be revisited if collection hits a ceiling, through a new ADR.
- **Contributors are volunteers.** There is no payment tracking. Trust grows through levels: new contributor → contributor → reviewer → language lead.
- **Launch languages** are the African locales shared with Watchtower: Kiswahili (`sw`), Luganda (`lg`), Kinyarwanda (`rw`), Amharic (`am`), Kikuyu (`ki`), Sukuma (`suk`), Dholuo (`luo`), Afaan Oromoo (`om`), and Dinka / Thuɔŋjäŋ (`din`). Languages are rows in the database. English, and French where it helps, serve as source languages.
- **Task types:** *translate*, which turns a civic source segment into parallel data, and *write*, an original response to a civic prompt in the speaker's own language.
- **Verification:** every row needs a second qualified speaker, and nobody reviews their own work. Disagreements go to a third reviewer and are recorded. ~~A language opens for contributions once it has at least two approved reviewers.~~ *Amended 2026-10-20:* a language accepts contributions from its first volunteer. Waiting for reviewers kept volunteers from starting at all; contributions now wait as pending until a reviewer other than their author reviews them, so the second-speaker rule still holds for every verified row.
- **Provenance on every row:** contributor, consent version, source and licence, reviewer, and timestamps.
- **Machine-translation guard:** paste events are logged, reviewers can reject a row as "reads as machine-translated", and that rate is tracked per contributor.
- **Text first, voice second.** The schema carries a `modality` field and consent that covers voice separately, so audio can be added without migrating existing data.

## Consequences

### Positive
- The corpus contains new data that existing public datasets don't already have.
- Every row can be traced to a consenting contributor and a reviewer.
- Consent withdrawal can be honoured row by row (ADR 0011 patch releases).

### Negative / trade-offs
- Collection is slower than post-editing machine drafts.
- Throughput depends on recruiting and keeping volunteer reviewers in every language.

## Open questions
- ~~The licence volunteers grant on their contributions (CC-BY-4.0 or CC0).~~ Settled as CC-BY-4.0 by ADR 0013.
- Minimum contributor age, or a guardian-consent flow.
