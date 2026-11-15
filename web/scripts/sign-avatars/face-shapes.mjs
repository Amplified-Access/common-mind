// The face shapes a signing avatar keeps, under the names the web app looks
// for. Shared by both builds.

// The ARKit face shapes: brows and eyes for the grammar of questions and
// feeling, mouth shapes for mouthing and expression.
export const FACE_SHAPES = [
  "browDownLeft", "browDownRight", "browInnerUp", "browOuterUpLeft", "browOuterUpRight",
  "cheekPuff", "eyeBlinkLeft", "eyeBlinkRight", "eyeSquintLeft", "eyeSquintRight",
  "eyeWideLeft", "eyeWideRight", "jawOpen", "mouthClose", "mouthFunnel", "mouthPucker",
  "mouthSmileLeft", "mouthSmileRight", "mouthFrownLeft", "mouthFrownRight",
  "mouthStretchLeft", "mouthStretchRight", "mouthRollLower", "mouthPressLeft", "mouthPressRight",
];

// The visemes, mouth shapes for speech sounds, for mouthing words while
// signing, under their Meta names (viseme_PP, viseme_aa, …). The silent one
// is left out.
export const VISEMES = ["PP", "FF", "TH", "DD", "kk", "CH", "SS", "nn", "RR", "aa", "E", "I", "O", "U"].map((v) => `viseme_${v}`);
