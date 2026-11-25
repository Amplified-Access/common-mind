// The landmarks file recorded beside each signed take in the Data Lab
// (ADR 0014): per video frame, the signer's body, hands and face, as the
// tracker saw them. It lets the avatar replay a sign and makes the data
// usable without the video.
//
// Coordinates are of the camera image as recorded, unmirrored (the preview
// is mirrored for the signer only):
// - pose, left, right: x and y from 0 to 1 across the image, z depth on the
//   same scale as x (smaller is nearer the camera); pose points add a
//   visibility from 0 to 1.
// - poseWorld, leftWorld, rightWorld: metres, pose from the middle of the
//   hips and each hand from its own centre.
// - left and right are the signer's own hands, as MediaPipe Holistic labels them.
// - face: expression weights from 0 to 1, in the order of `blendshapes`.
// The face mesh itself is left out to keep files small; it can be extracted
// from the video later.

type Point = { x: number; y: number; z: number; visibility?: number };

/** The parts of a MediaPipe HolisticLandmarkerResult the log keeps. */
export type TrackerResult = {
  poseLandmarks: Point[][];
  poseWorldLandmarks: Point[][];
  leftHandLandmarks: Point[][];
  leftHandWorldLandmarks: Point[][];
  rightHandLandmarks: Point[][];
  rightHandWorldLandmarks: Point[][];
  faceBlendshapes: { categories: { categoryName: string; score: number }[] }[];
};

type Triple = [x: number, y: number, z: number];

export type LandmarkFrame = {
  /** Seconds since the take started. */
  t: number;
  /** 33 × [x, y, z, visibility] */
  pose: [x: number, y: number, z: number, visibility: number][] | null;
  poseWorld: Triple[] | null;
  /** 21 × [x, y, z] each */
  left: Triple[] | null;
  leftWorld: Triple[] | null;
  right: Triple[] | null;
  rightWorld: Triple[] | null;
  face: number[] | null;
};

export type LandmarksFile = {
  format: "commonmind.sign-landmarks";
  version: 1;
  /** Which tracker and model produced the points. */
  tracker: string;
  /** The recorded video's size in pixels. */
  video: { width: number; height: number };
  /** The face weights' names, in order. */
  blendshapes: string[];
  frames: LandmarkFrame[];
};

const round = (v: number, places: number) => {
  const f = 10 ** places;
  return Math.round(v * f) / f;
};

// Four places is a ten-thousandth of the image, or 0.1 mm in world units.
const triple = (p: Point): Triple => [round(p.x, 4), round(p.y, 4), round(p.z, 4)];
const triples = (sets: Point[][]) => (sets[0]?.length ? sets[0].map(triple) : null);

/**
 * Collects a take's frames as they're tracked, then assembles the file.
 * One log serves every take: reset it before the next one.
 */
export function createLandmarkLog(meta: Pick<LandmarksFile, "tracker" | "video">) {
  let frames: LandmarkFrame[] = [];
  let blendshapes: string[] = [];

  return {
    add(result: TrackerResult, seconds: number) {
      const face = result.faceBlendshapes[0]?.categories ?? [];
      if (face.length && !blendshapes.length) blendshapes = face.map((c) => c.categoryName);
      const pose = result.poseLandmarks[0];
      frames.push({
        t: round(seconds, 3),
        pose: pose?.length ? pose.map((p) => [...triple(p), round(p.visibility ?? 0, 2)]) : null,
        poseWorld: triples(result.poseWorldLandmarks),
        left: triples(result.leftHandLandmarks),
        leftWorld: triples(result.leftHandWorldLandmarks),
        right: triples(result.rightHandLandmarks),
        rightWorld: triples(result.rightHandWorldLandmarks),
        face: face.length ? face.map((c) => round(c.score, 4)) : null,
      });
    },

    /** The share of frames, from 0 to 1, with at least one hand tracked. */
    handCoverage() {
      if (!frames.length) return 0;
      return frames.filter((f) => f.left || f.right).length / frames.length;
    },

    file(): LandmarksFile {
      return { format: "commonmind.sign-landmarks", version: 1, ...meta, blendshapes, frames };
    },

    reset() {
      frames = [];
      blendshapes = [];
    },
  };
}

export type LandmarkLog = ReturnType<typeof createLandmarkLog>;

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/**
 * A landmarks file read back from storage, or null when it isn't one this
 * version writes. Checks the outline and each frame's time; the points
 * themselves are trusted as the tracker wrote them.
 */
export function parseLandmarks(data: unknown): LandmarksFile | null {
  if (!isRecord(data) || data.format !== "commonmind.sign-landmarks" || data.version !== 1) return null;
  const { video, blendshapes, frames } = data;
  if (!isRecord(video) || typeof video.width !== "number" || typeof video.height !== "number") return null;
  if (!Array.isArray(blendshapes) || !blendshapes.every((n) => typeof n === "string")) return null;
  if (!Array.isArray(frames) || !frames.every((f) => isRecord(f) && typeof f.t === "number")) return null;
  return data as LandmarksFile;
}
