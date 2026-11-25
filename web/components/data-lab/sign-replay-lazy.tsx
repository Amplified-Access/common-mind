"use client";

import dynamic from "next/dynamic";

// The avatar brings three.js, the retargeting and a model: it loads only
// when a page shows it.
const loading = () => (
  <p className="flex size-full min-h-40 items-center justify-center rounded-inset border border-line font-mono text-xs text-subtle">
    Loading the signer…
  </p>
);

export const SignReplay = dynamic(() => import("./sign-replay").then((m) => m.SignReplay), { ssr: false, loading });

export const LiveAvatar = dynamic(() => import("./sign-replay").then((m) => m.LiveAvatar), { ssr: false, loading });
