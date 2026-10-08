"use client";

import { Mic01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { ParticleOrb } from "@/components/system/particle-orb";
import { cn } from "@/lib/utils";

// The orb mid-recording: a clock counts up in the pill at its centre while
// a made-up speech rhythm, phrases of syllables with pauses between, swells
// the orb's ripples. Both run only while the orb is on screen; reduced
// motion holds the mock's still frame.

const PHRASE_MS = [2600, 900];
const SYLLABLE_MS = 140;

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function SpeechOrb({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [seconds, setSeconds] = useState(18);
  const [energy, setEnergy] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;

    let timers: ReturnType<typeof setInterval>[] = [];
    const start = () => {
      let speaking = true;
      let phraseLeft = PHRASE_MS[0];
      timers = [
        setInterval(() => setSeconds((s) => (s + 1) % 3600), 1000),
        setInterval(() => {
          phraseLeft -= SYLLABLE_MS;
          if (phraseLeft <= 0) {
            speaking = !speaking;
            phraseLeft = PHRASE_MS[speaking ? 0 : 1] * (0.7 + Math.random() * 0.6);
          }
          setEnergy(speaking ? 0.35 + Math.random() * 0.65 : 0);
        }, SYLLABLE_MS),
      ];
    };
    const stop = () => {
      timers.forEach(clearInterval);
      timers = [];
      setEnergy(0);
    };

    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()));
    io.observe(el);
    return () => {
      io.disconnect();
      stop();
    };
  }, [reduce]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <ParticleOrb variant="rows" energy={energy} className="aspect-auto size-full" />
      <span className="absolute top-1/2 left-1/2 inline-flex h-9 -translate-1/2 items-center gap-2 rounded-full border border-line-strong bg-[#12110d]/90 px-4 text-lg leading-none text-foreground tabular-nums">
        <HugeiconsIcon icon={Mic01Icon} className="size-4.5" />
        {clock(seconds)}
      </span>
    </div>
  );
}

export { SpeechOrb };
