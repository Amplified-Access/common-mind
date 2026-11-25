"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { SignStage } from "@/components/sign/sign-stage";
import { Segmented } from "@/components/system/segmented";
import { type Body, DEFAULT_BODY } from "@/lib/sign/body";
import { CHARACTERS } from "@/lib/sign/characters";
import { replayTimeline } from "@/lib/sign/replay";
import type { LandmarksFile } from "@/lib/sign-capture/landmarks";
import { cn } from "@/lib/utils";

/** Seconds the avatar rests between plays. */
const LOOP_PAUSE = 1.2;

const SPEEDS = [
  { id: "1", label: "1×" },
  { id: "0.5", label: "½×" },
];

/**
 * A recorded take replayed by the avatar from its tracked landmarks, on a
 * loop, at full or half speed. It shows how the tracking read the sign, as
 * the avatar would sign it.
 */
function SignReplay({ landmarks, className }: { landmarks: LandmarksFile; className?: string }) {
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
        className="aspect-video w-full overflow-hidden rounded-inset border border-line bg-background"
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

export { SignReplay };
