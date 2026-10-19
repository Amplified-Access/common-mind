# Source ledger

Every source of English (or French) text considered for the Civic Corpus: what has been ingested, what is ready to build, what needs permission, and what was ruled out and why. Read this before researching sources, so checked ground isn't covered twice. Update it after every run, import, or licence check.

The licence rules are in [ADR 0013](../docs/adr/0013-source-acquisition-and-licences.md). How each built source is fetched and judged is in [README.md](README.md).

## Ingested

| Source | `--site` | Licence | Run | Stories found → accepted | Sentences imported |
|---|---|---|---|---|---|
| VOA Learning English | `voa-le` | public domain (VOA-produced only) | 2026-10-19 | 310 → 127 | 434 from 98 stories |
| VOA Africa | `voa-af` | public domain (VOA-produced only) | 2026-10-19/20 | 3,245 → 906 | 1,846 from 702 stories |

**Imports** (identical in dev and production). Every batch is recorded as `items.jsonl`, so this table maps ids to sources. Dry runs also use up ids, which leaves gaps.

| Source | Prod batch | Dev batch | Sources | Items |
|---|---|---|---|---|
| VOA Learning English, first rules | 2 | 5 | 40 | 137 |
| VOA Learning English, broader categories | 4 | 7 | 58 | 297 (135 already there) |
| VOA Africa | 6 | 9 | 702 | 1,846 |

Production total: 2,280 sentences from 800 stories (train 2,075, test 205).

**What these runs left out,** if more is needed from the same sources:
- **Stories with ID-only URLs** (`/a/8207750.html`). Discovery matches East Africa slugs only, and newer stories have no slug.
- **Learning English, pre-2015:** 80 stories have no credit line in the current format. About 20 are old "VOA Special English" reports ("…written by Jerilyn Watson"), VOA-produced but rejected. The rest have no parseable body.
- **VOA Africa without a byline:** 30 stories with text, rejected. The other 1,219 are audio or video.
- **Candidate sentences the rules didn't approve:** 1,835 (Learning English) and 9,829 (VOA Africa), in `data/<site>/review.csv`. They lack a category guess, carry a flag, or contain a pronoun.
- **Skew:** VOA Africa's own East Africa stories are mostly by its South Sudan in Focus team.

**Wire copy found and refused:** 100 Learning English stories adapted from AP or Reuters. 931 VOA Africa stories bylined AFP, Reuters or AP.

## Ready to build (licence checked, no code yet)

| Source | Licence | Evidence | Categories it helps | Notes |
|---|---|---|---|---|
| **voanews.com** | public domain (VOA-produced) | same terms as VOA Africa | all | Add a `Site` entry in `voa.py` (byline judging). Story ids are shared with VOA Africa (`voa-<id>` keys), so overlaps import once. |
| **Kenyan county legislation** (public participation acts, ward development fund acts, access to information) | `public-domain-statute` | Copyright Act Cap. 130, s.2: a literary work "does not include a written law or a judicial decision". Read in full on 2026-10-19. | rights, public-meetings, local-government, feedback | Legal register, so filter for short plain clauses. Use the official text. Most county acts have no Kiswahili version. |
| **Ugandan laws** (Local Governments Act, Access to Information Act) | `public-domain-statute` | Copyright and Neighbouring Rights Act 2006, s.7 "public benefit works not protected" (s.6 in the Cap. 222 revision) | rights, local-government | **Read s.7's text before building.** It was confirmed from search summaries only, because ULII blocked the download. |
| **Global Voices** | `CC-BY-3.0` | republishing guidelines, globalvoices.org/about/global-voices-attribution-policy | rights, elections, accountability, community-problems | Skip articles with a Swahili or Amharic Lingua version. Images are excluded. Quoted social-media posts are personal data. |
| **Wikinews archive** | `CC-BY-2.5` | read-only since 2026-05-04, content stays licensed | elections, public-services | Small East Africa set. |
| **US State Dept, Country Reports on Human Rights Practices** | `public-domain` | 17 U.S.C. § 105 (federal works). state.gov blocked a direct check. | elections, accountability, rights | Report register. Recent editions were cut back. |
| **World Bank Open Knowledge Repository** | `CC-BY-3.0-IGO` | per item: **check every item page** (some are CC BY-NC-ND) | local-government, accountability | Donor register, low yield of plain sentences. World Bank asks for a "not an official translation" disclaimer on translations. |
| **Open Contracting Partnership** | `CC-BY-4.0` | per page | accountability, promises | Procurement-focused. |

## Needs permission (good content, no open licence)

Ask with one standard data-donation letter.

| Rights holder | Material | Why it's wanted |
|---|---|---|
| **IFES** | "Elections in Kenya: 2022 General Elections FAQs" (and other countries) | Plain Q&A about voting. Top target for elections. |
| **Open Government Partnership** | Local action plans: Elgeyo Marakwet, Makueni, Nandi, Nairobi | Lists of county commitments. Top target for promises. No licence found on the site. |
| Nairobi City County, KCCA | Citizen service charters | Short sentences on services and hours |
| Kakamega County | Citizen budget (popular version) | Priorities, development |
| IEBC (Kenya), NEC (South Sudan) | Voter education material | Elections |
| SSACC (South Sudan) | Anti-corruption citizen guide | Accountability, feedback |
| Africa Check | Fact-checks and factsheets | Its terms allow republishing in full only; translation needs permission |

## Ruled out

| Source | Reason |
|---|---|
| Kenyan government publications (service charters, IEBC guides, Hansard, gazette notices, county budgets) | Government copyright, Copyright Act Cap. 130 s.25 (50 years). Only written laws and judicial decisions are excluded. Gemini's research said the opposite, citing s.26/s.45, and was wrong. Needs permission instead. |
| Twaweza, Sauti za Wananchi | Custom non-commercial terms, and Kiswahili versions exist |
| Afrobarometer | CC BY-SA (share-alike) |
| Wikipedia, Wikivoyage | CC BY-SA |
| World Bank items under CC BY-NC-ND 3.0 IGO (e.g. "Documenting Decentralization: Unit Proliferation in Uganda") | Non-commercial and no-derivatives |
| UNESCO, FAO, WHO publications | Usually CC BY-NC-SA or BY-SA 3.0 IGO |
| The Conversation Africa | CC BY-ND |
| CIPIT (Strathmore) copyright guide | All rights reserved |
| Kenyan and Ugandan Copyright Acts | Not civic content. Gemini proposed them as sources. |
| USAID DEC reports (e.g. South Sudan land tenure profile) | Often written by contractors, so not automatically public domain. Check each one before use. |
| National constitutions, UDHR, Bible and Watchtower material | Existing translations in the launch languages |
| African Storybook | Existing translations, and not civic |
| FLORES-200, NTREX, MAFAND-MT, SALT, Lacuna/Masakhane datasets | Benchmark or training overlap (ADR 0013) |
| AP, Reuters and AFP copy on any site | Not covered by the carrying site's licence |
| Gemini Deep Research output (2026-10-19) | Used as leads only. Retrieval dates were invented, quotations unverified, licence evidence generic, and the Kenyan statute claim wrong. Its useful leads are in the tables above. |
