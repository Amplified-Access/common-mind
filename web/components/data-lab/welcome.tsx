"use client";

import { useRouter } from "next/navigation";

import { useLab } from "./lab-app";
import { Onboarding } from "./onboarding";
import { useProgress } from "./use-progress";

/**
 * Joining the Data Lab, adding languages, or accepting a new consent version.
 * Afterwards the volunteer goes to their workspace.
 */
function Welcome() {
  const { state, refresh } = useLab();
  const { board } = useProgress();
  const router = useRouter();
  if (!board) return <p className="font-mono text-xs text-faint">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <Onboarding
        languages={board.languages}
        volunteer={state.status === "ready" ? state.volunteer : undefined}
        onDone={async () => {
          await refresh();
          router.push("/data-lab/workspace");
        }}
      />
    </div>
  );
}

export { Welcome };
