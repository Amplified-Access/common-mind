# Changelog

All notable changes to CommonMind are recorded here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-11-20

First public release of CommonMind: open language models, datasets and benchmarks for African languages, and the Data Lab for building civic language datasets.

### Added

- **Website** at [thecommonmind.org](https://thecommonmind.org): models, datasets, benchmarks, languages, research, licenses and Get Started pages, with a canonical URL on every public page ([#1], [#2], [#8], [#17], [#20], [#25]).
- **Playground**: try all four published translation models (Swahili-nllb-1.3b, Swahili-nllb-600m, Swahili-gemma-1b-it, Luganda-gemma-1b-it) from the browser, served by the inference server on a Runpod GPU pod.
- **Data Lab**: a standalone app where volunteers create, annotate and verify civic language datasets, starting with the Civic Corpus. It has Firebase sign-in, contributions before a language has reviewers, and admin views of each translator's work and contributions per language ([#3], [#14], [#15], [#16], [#32], [#33]).
- **Source ingestion**: an offline pipeline with a licence allowlist and provenance on every source, starting with Voice of America ([#12], [#13], [#23]; ADR 0013).
- **Backend**: Go + Gin API for the Data Lab and the corpus release engine, on PostgreSQL, Redis/Asynq and Cloudflare R2 ([#3]).
- **Content in Sanity** for site copy, the footer, the call to action and language details ([#3], [#9]).
- **Signing avatar** at `/sign`, signing American Sign Language with mouthing and face shapes, with Kenyan and Ugandan Sign Language shown as concepts ([#28], [#31], [#34], [#37]).
- **Karimojong** as a supported language ([#21]).
- `CODEOWNERS`, so every pull request has a named reviewer ([#42]).

### Changed

- The project is licensed under **Apache 2.0** ([#41]).
- The backend builds and tests with Go 1.26 ([#40]).

### Fixed

- The site now shows the correct licenses for the Gemma-based models: Luganda-gemma-1b-it is under the Gemma terms, and Swahili-gemma-1b-it is under the Gemma terms plus a non-commercial restriction ([#43]).

### Security

- Fixed the open Dependabot alerts and updated `next`, `grpc` and the OpenTelemetry SDK ([#29], [#35], [#36], [#38], [#39]).
- The inference setup reads pod secrets with `read -s` instead of putting them on the command line ([#42]).

[Unreleased]: https://github.com/Amplified-Access/common-mind/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Amplified-Access/common-mind/releases/tag/v1.0.0
[#1]: https://github.com/Amplified-Access/common-mind/pull/1
[#2]: https://github.com/Amplified-Access/common-mind/pull/2
[#3]: https://github.com/Amplified-Access/common-mind/pull/3
[#8]: https://github.com/Amplified-Access/common-mind/pull/8
[#9]: https://github.com/Amplified-Access/common-mind/pull/9
[#12]: https://github.com/Amplified-Access/common-mind/pull/12
[#13]: https://github.com/Amplified-Access/common-mind/pull/13
[#14]: https://github.com/Amplified-Access/common-mind/pull/14
[#15]: https://github.com/Amplified-Access/common-mind/pull/15
[#16]: https://github.com/Amplified-Access/common-mind/pull/16
[#17]: https://github.com/Amplified-Access/common-mind/pull/17
[#20]: https://github.com/Amplified-Access/common-mind/pull/20
[#21]: https://github.com/Amplified-Access/common-mind/pull/21
[#23]: https://github.com/Amplified-Access/common-mind/pull/23
[#25]: https://github.com/Amplified-Access/common-mind/pull/25
[#28]: https://github.com/Amplified-Access/common-mind/pull/28
[#29]: https://github.com/Amplified-Access/common-mind/pull/29
[#31]: https://github.com/Amplified-Access/common-mind/pull/31
[#32]: https://github.com/Amplified-Access/common-mind/pull/32
[#33]: https://github.com/Amplified-Access/common-mind/pull/33
[#34]: https://github.com/Amplified-Access/common-mind/pull/34
[#35]: https://github.com/Amplified-Access/common-mind/pull/35
[#36]: https://github.com/Amplified-Access/common-mind/pull/36
[#37]: https://github.com/Amplified-Access/common-mind/pull/37
[#38]: https://github.com/Amplified-Access/common-mind/pull/38
[#39]: https://github.com/Amplified-Access/common-mind/pull/39
[#40]: https://github.com/Amplified-Access/common-mind/pull/40
[#41]: https://github.com/Amplified-Access/common-mind/pull/41
[#42]: https://github.com/Amplified-Access/common-mind/pull/42
[#43]: https://github.com/Amplified-Access/common-mind/pull/43
