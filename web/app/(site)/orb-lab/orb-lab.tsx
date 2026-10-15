"use client";

import { useState } from "react";

import { Container } from "@/components/common/container";
import { ORB_VARIANTS, type OrbVariantName } from "@/components/system/orb-variants";
import { ParticleOrb } from "@/components/system/particle-orb";
import { cn } from "@/lib/utils";

type Range = [min: number, max: number, step: number];

const COMMON: Record<string, Range> = {
  scale: [0.3, 1, 0.01],
  pointSize: [0.5, 4, 0.05],
  opacity: [0.1, 2, 0.05],
  spin: [-1, 1, 0.01],
  flow: [0, 2, 0.01],
};

const RANGES: Record<OrbVariantName, Record<string, Range>> = {
  rows: {
    rows: [40, 500, 10],
    perRow: [60, 1200, 20],
    ...COMMON,
    tilt: [-1.6, 1.6, 0.01],
    wave: [0, 0.3, 0.005],
    waveFreq: [0.2, 6, 0.05],
    peel: [0, 1, 0.01],
    peelThreshold: [-0.6, 0.9, 0.01],
    peelScale: [0.2, 3, 0.01],
    twist: [-3, 3, 0.01],
  },
  shell: {
    count: [2000, 80000, 1000],
    inner: [0, 4000, 50],
    ...COMMON,
    thickness: [0, 0.2, 0.005],
    wobble: [0, 0.2, 0.005],
    wobbleFreq: [0.2, 8, 0.05],
    chaos: [0, 0.2, 0.005],
    chaosFreq: [0.2, 12, 0.1],
    rim: [0.2, 8, 0.05],
    face: [0, 1, 0.01],
  },
};

const VARIANTS = Object.keys(ORB_VARIANTS) as OrbVariantName[];

function OrbLab() {
  const [variant, setVariant] = useState<OrbVariantName>("rows");
  const [all, setAll] = useState<Record<OrbVariantName, Record<string, number>>>({
    rows: { ...ORB_VARIANTS.rows.defaults },
    shell: { ...ORB_VARIANTS.shell.defaults },
  });
  const [energy, setEnergy] = useState(0);
  const [copied, setCopied] = useState(false);
  const settings = all[variant];

  const set = (key: string, value: number) => setAll({ ...all, [variant]: { ...settings, [key]: value } });

  const copy = async () => {
    await navigator.clipboard.writeText(JSON.stringify({ variant, ...settings }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Container className="grid gap-10 py-16 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex items-center justify-center border border-line bg-black">
        <ParticleOrb variant={variant} settings={settings} energy={energy} className="max-w-160" />
      </div>

      <div className="flex flex-col gap-4 font-mono text-xs">
        <div className="flex gap-2">
          {VARIANTS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setVariant(name)}
              className={cn(
                "border px-3 py-2",
                name === variant ? "border-signal text-signal" : "border-line-strong hover:text-signal",
              )}
            >
              {name}
            </button>
          ))}
        </div>
        {Object.entries(RANGES[variant]).map(([key, [min, max, step]]) => (
          <label key={key} className="flex flex-col gap-1.5">
            <span className="flex justify-between text-faint">
              {key}
              <span className="text-foreground tabular-nums">{settings[key]}</span>
            </span>
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={settings[key]}
              onChange={(e) => set(key, Number(e.target.value))}
              className="accent-signal"
            />
          </label>
        ))}
        <label className="flex flex-col gap-1.5 border-t border-line pt-4">
          <span className="flex justify-between text-faint">
            energy
            <span className="text-foreground tabular-nums">{energy}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={energy}
            onChange={(e) => setEnergy(Number(e.target.value))}
            className="accent-signal"
          />
        </label>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={copy} className="border border-line-strong px-3 py-2 hover:text-signal">
            {copied ? "Copied" : "Copy settings"}
          </button>
          <button
            type="button"
            onClick={() => setAll({ ...all, [variant]: { ...ORB_VARIANTS[variant].defaults } })}
            className="border border-line-strong px-3 py-2 hover:text-signal"
          >
            Reset
          </button>
        </div>
      </div>
    </Container>
  );
}

export { OrbLab };
