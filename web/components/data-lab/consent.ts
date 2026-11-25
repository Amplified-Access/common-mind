// Must equal domain.CurrentConsentVersion in the backend. Bump both, and the
// text below, together; volunteers then accept again before contributing.
export const CONSENT_VERSION = "2026-10-14";

export const consentPoints = [
  "Your translations and writing are published in CommonMind's open datasets, for research and for building language technology for African languages.",
  "Another speaker of the language reviews each contribution before it joins a dataset.",
  "Your name and email stay with CommonMind and are kept out of published datasets.",
  "Leave personal details about yourself and other people out of what you write.",
  "You can withdraw at any time, and your contributions are removed from the next release.",
];

// What volunteers agree to before recording. It extends the consent above
// (covers_voice on the same version), so it changes with CONSENT_VERSION.
export const voiceConsentPoints = [
  "Your recordings are published in CommonMind's open datasets, where anyone can listen to them, for research and for building speech technology for African languages.",
  "A recording carries your voice, which people who know you may recognise. Your name and email are kept out of published datasets.",
  "Say only what the task asks. Leave out names, places and other details that identify you or anyone else.",
  "Another speaker of the language listens to each recording before it joins a dataset.",
  "You can withdraw at any time, and your recordings are removed from the next release.",
];

// What signers agree to before recording on camera in a sign language
// (ADR 0014). Like the voice consent, it extends the consent above
// (covers_video on the same version).
export const videoConsentPoints = [
  "Your videos are published in CommonMind's open datasets, where anyone can watch them, for research and for building sign language technology for African sign languages.",
  "A video shows your face, hands and what is behind you, so people who know you can recognise you. Your name and email are kept out of published datasets.",
  "The points your camera tracks on your hands, body and face while you sign are published with each video.",
  "Sign only what the task asks, in front of a plain background with nothing personal in view.",
  "Another signer of the language watches each video before it joins a dataset.",
  "You can withdraw at any time, and your videos are removed from the next release.",
];
