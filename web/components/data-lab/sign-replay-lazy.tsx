"use client";

import dynamic from "next/dynamic";

// The replay brings three.js, the retargeting and an avatar model: it loads
// only when someone opens it.
export const SignReplay = dynamic(() => import("./sign-replay").then((m) => m.SignReplay), {
  ssr: false,
  loading: () => (
    <p className="flex aspect-video w-full items-center justify-center rounded-inset border border-line font-mono text-xs text-subtle">
      Loading the signer…
    </p>
  ),
});
