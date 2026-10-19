# ADR 0013 — Source acquisition and licence policy

**Status:** Accepted  
**Date:** 2026-10-19

## Context

Volunteers in the Data Lab translate English (and French) source segments into the launch languages (ADR 0010). Every translation is a derivative of its source, so the source's licence decides whether the row can be released at all. The release flow publishes snapshots to Hugging Face and Kaggle (ADR 0011), which needs a licence that allows redistribution and commercial reuse.

Research into candidate sources showed that open civic text from the launch countries is scarce:

- Government guides, service charters, Hansard and gazette notices are usually under government copyright. Kenya's Copyright Act (Cap. 130) confers copyright on government works (s.25) and excludes only "a written law or a judicial decision" (s.2, definition of literary work). Uganda's Copyright and Neighbouring Rights Act 2006 excludes laws and court decisions (s.7, "public benefit works not protected").
- Usable open sources exist: Voice of America's own text (public domain), US federal government works, Global Voices (CC BY 3.0), the Wikinews archive (CC BY 2.5), the World Bank Open Knowledge Repository (CC BY 3.0 IGO, checked per item), Open Contracting Partnership (CC BY 4.0), and the laws themselves.
- Several of those sources require attribution, so a CC0 corpus would have to leave them out.

ADR 0011 also fixes the train/test split by hashing the source's ID at ingestion, so what a "source" is has to be settled before real data arrives.

## Decision

**Corpus licence.** The Civic Corpus is released under **CC-BY-4.0**. This closes the licence question left open in ADR 0010. Each release's datasheet carries the attribution its sources require.

**Licence allowlist.** The importer accepts only these licence identifiers:

| Identifier | Meaning |
|---|---|
| `CC0-1.0` | CC0 dedication |
| `CC-BY-2.0`, `CC-BY-2.5`, `CC-BY-3.0`, `CC-BY-3.0-IGO`, `CC-BY-4.0` | Creative Commons Attribution |
| `public-domain` | No copyright, e.g. US federal works under 17 U.S.C. § 105 |
| `public-domain-statute` | Excluded by the source country's copyright law, e.g. a written law |

Share-alike (`-SA`), non-commercial (`-NC`), no-derivatives (`-ND`), "all rights reserved", and sources with no licence statement are refused. Text from a rights holder who grants permission in writing is imported as `CC-BY-4.0` or `CC0-1.0` according to the grant, with the grant filed as its evidence.

**Evidence on every source.** A source records the URL of the document, when it was retrieved, a link to its licence evidence, and the content hash and object key of the raw copy kept in R2. `public-domain` and `public-domain-statute` sources must link their evidence (the rights page or the statute section), since no licence document says it for them.

**One source is one document.** `sources.key` identifies a single document, and the split is hashed from it. Documents from the same publisher or series share a `collection`, which does not affect the split. A whole series never lands in the test split together.

**Text that is excluded,** even when its licence allows it:
- Text that already has a translation in any launch language (for example a constitution with an official Kiswahili text, or a news story also run by a Swahili, Amharic or Afaan Oromoo service). Volunteers could copy it, and it adds nothing new.
- Text that appears in machine-translation benchmarks or training sets (FLORES-200, NTREX, MAFAND-MT, SALT and the other datasets behind the published models).
- Wire-service copy carried by an open publisher (AP, AFP, Reuters), which the publisher's licence does not cover.
- Sentences containing personal data about private individuals.

**Acquisition is offline, and a person approves every segment.** Sources are fetched, extracted and segmented outside the API. The output is a candidate list that a person reviews: they confirm each segment reads as plain civic language and confirm its category. Only approved segments become an import file, which `cmd/datalab` validates against the allowlist and records as an import batch.

**Models on the source side.** Tools may suggest how to segment text or which category a segment belongs to, and a person confirms every suggestion. No model writes, rewrites or translates a source segment. Corpus rows remain human-only (ADR 0010).

**Items can be retired.** An item withdrawn after import (a licence problem, personal data, a bad segment) is marked `retired`. It is never deleted, because contributions refer to it, and it is no longer offered to volunteers.

## Consequences

### Positive
- Every row in a release can be traced to a document, a licence, and the evidence for that licence.
- Attribution-licensed sources, which are most of the open civic text found, can be used.
- The split is spread across documents, not whole series.
- A bad import can be found by batch and its items retired.

### Negative / trade-offs
- CC-BY-4.0 requires attribution from corpus users, which CC0 would not.
- Open civic text for elections, public meetings and political commitments is thin. Those categories depend on team-written CC0 segments and on permission from rights holders.
- Reviewing every candidate segment is slow. It is kept on purpose until the filters have earned trust.
