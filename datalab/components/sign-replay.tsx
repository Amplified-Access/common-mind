"use client";

import { type RefObject, useEffect, useMemo, useRef, useState } from "react";

import { SignStage } from "@/components/sign/sign-stage";
import { Segmented } from "@/components/ui/segmented";
import { type Body, DEFAULT_BODY } from "@/lib/sign/body";
import { CHARACTERS } from "@/lib/sign/characters";
import { type LiveFrame, createLiveRetarget } from "@/lib/sign/live";
import { replayTimeline } from "@/lib/sign/replay";
import type { Pose } from "@/lib/sign/types";
import type { LandmarksFile } from "@/lib/sign-capture/landmarks";
import { cn } from "@/lib/utils";

/** Seconds the avatar rests between plays. */
const LOOP_PAUSE = 1.2;

const SPEEDS = [
  { id: "1", label: "1×" },
  { id: "0.5", label: "½×" },
];

const stageClasses = "aspect-video w-full overflow-hidden rounded-inset border border-line bg-background";

/**
 * A recorded take replayed by the avatar from its tracked landmarks. It
 * shows how the tracking read the sign, as the avatar would sign it.
 *
 * With `follow`, the avatar keeps time with that video of the same take:
 * playing, pausing, seeking and slowing with it, so the two can be compared
 * side by side. Without, it loops on its own at full or half speed.
 */
function SignReplay({
  landmarks,
  follow,
  className,
}: {
  landmarks: LandmarksFile;
  follow?: RefObject<HTMLVideoElement | null>;
  className?: string;
}) {
  const [body, setBody] = useState<Body>(DEFAULT_BODY);
  const [speed, setSpeed] = useState("1");
  const [run, setRun] = useState(0);
  const timeline = useMemo(() => replayTimeline(landmarks, body), [landmarks, body]);
  const loop = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (loop.current) clearTimeout(loop.current);
    },
    [],
  );

  const again = () => {
    if (loop.current) clearTimeout(loop.current);
    loop.current = setTimeout(() => setRun((n) => n + 1), LOOP_PAUSE * 1000);
  };

  // The landmarks' times count from the start of the take, as the video's do.
  // Read each frame by the stage's loop, never while rendering.
  const videoTime = () => follow?.current?.currentTime ?? null;

  if (follow) {
    return (
      <SignStage
        character={CHARACTERS[0]}
        timeline={timeline}
        run={0}
        speed={1}
        paused
        mouthing={false}
        onBody={setBody}
        followTime={videoTime}
        className={cn(stageClasses, className)}
      />
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <SignStage
        character={CHARACTERS[0]}
        timeline={timeline}
        run={run}
        speed={Number(speed)}
        paused={false}
        mouthing={false}
        onEnd={again}
        onBody={setBody}
        className={stageClasses}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs text-faint">
          The avatar replays the hands, face and head as the camera tracked them.
        </span>
        <Segmented label="Replay speed" value={speed} onChange={setSpeed} items={SPEEDS} />
      </div>
    </div>
  );
}

/**
 * The avatar mirroring the signer live: each frame the camera tracks, read
 * from `source`, becomes the avatar's pose as it arrives. Before anything is
 * tracked, it stands at rest.
 */
function LiveAvatar({ source, className }: { source: RefObject<LiveFrame | null>; className?: string }) {
  const [live] = useState(createLiveRetarget);
  const body = useRef<Body>(DEFAULT_BODY);
  const last = useRef<{ frame: LiveFrame["frame"]; pose: Pose } | null>(null);

  // Read every frame by the stage's loop: a new tracked frame moves the
  // avatar on; between them it holds.
  const livePose = () => {
    const shared = source.current;
    if (!shared) return null;
    if (last.current?.frame !== shared.frame) {
      const pose = live.update(shared.frame, shared.blendshapes, shared.video, body.current);
      last.current = { frame: shared.frame, pose };
    }
    return last.current.pose;
  };

  return (
    <SignStage
      character={CHARACTERS[0]}
      timeline={null}
      run={0}
      speed={1}
      paused
      mouthing={false}
      onBody={(b) => {
        body.current = b;
      }}
      livePose={livePose}
      className={cn(stageClasses, className)}
    />
  );
}

export { LiveAvatar, SignReplay };
