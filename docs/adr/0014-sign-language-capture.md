# ADR 0014 — Sign languages in the Data Lab: camera capture with hand tracking

**Status:** Accepted  
**Date:** 2026-11-25

## Context

The `/sign` avatar signs in ASL, and in Uganda Sign Language (USL, `ugn`) and Kenyan Sign Language (KSL, `xki`) by borrowing ASL signs. No open, commercial-use USL dataset exists, and the KSL datasets that do exist are restricted. Real USL and KSL signs have to come from Deaf signers.

The Data Lab already collects human text and voice under consent, with review by a second speaker (ADR 0010). Sign languages fit that pattern if the Data Lab can record a signer on camera.

## Decision

- **Sign languages are Data Lab languages.** They are `languages` rows with `modality = 'signed'`, listed beside the spoken languages where volunteers choose what to contribute to. USL (`ugn`) and KSL (`xki`) come first.
- **Signers record on camera.** In a signed language, a task is an English word or sentence to sign. Contributions there have `modality = 'video'`; text and voice are refused, and spoken languages refuse video.
- **Words first.** A new item kind, `word`, holds a civic word or short phrase to sign. Signers get word items before sentences (`translate` items), because single signs feed the `/sign` lexicon directly.
- **Video and landmarks are both kept.** The browser records the video and, at the same time, tracks the hands (21 points each), body (33 points) and face (52 expression weights) with MediaPipe Tasks Vision (Apache 2.0) running on the device. Both files go straight to object storage under the signer's prefix, like voice recordings. Landmarks are optional on submit, so a device that can't run the tracker never blocks a signer; they can be extracted from the video later.
- **No model labels anything.** The tracker measures where the hands are; it doesn't decide what was signed. A sign's meaning comes from the task the signer was given and from a Deaf reviewer's acceptance (ADR 0010 still holds). A sign recogniser may be trained later on verified recordings.
- **Separate consent for video.** A signer's video shows their face and hands and is published with the dataset. Volunteers agree to that separately (`consents.covers_video`), before their first recording.
- **Review by Deaf signers.** A reviewer in the sign language watches the video and accepts or rejects it. A recording can't be corrected.

## Consequences

### Positive
- The project gets its own USL and KSL signs under the corpus licence, for the avatar and for future recognition models.
- Landmarks let the avatar replay a recorded sign and make the data usable without the video.
- The voice pipeline (presigned upload, prefix checks, review) is reused.

### Negative / trade-offs
- Published video identifies signers more than voice does. The consent says so plainly.
- Video files are larger than audio (capped at 64 MB per take); storage costs grow with the dataset.
- Hand tracking is weaker when fingers are hidden or the hands touch; reviewers judge the video, not the landmarks.

## Open questions
- Self-hosting the MediaPipe runtime and model files instead of loading them from their public CDNs.
- How verified signs become `/sign` lexicon entries (retargeting landmarks to the avatar's hand model).
