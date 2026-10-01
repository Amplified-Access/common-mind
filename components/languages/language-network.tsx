"use client";

import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

import type { Language } from "./data";

type NodeInfo = { language: Language; models: number; corpora: number };

// Language families as a graph: family → branch → language. Languages with a
// built ecosystem carry a ring sized by what exists around them.
function LanguageNetwork({ nodes }: { nodes: NodeInfo[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const W = 720;
  const H = 360;

  const families = Array.from(new Set(nodes.map((n) => n.language.family)));
  const familyX = (i: number) => 120 + i * ((W - 240) / Math.max(1, families.length - 1));

  // Branch positions: one per (family, branch).
  const branches = Array.from(
    new Map(
      nodes.map((n) => [`${n.language.family}|${n.language.branch}`, n.language]),
    ).values(),
  );

  const leafPositions = new Map<string, { x: number; y: number }>();
  const branchPositions = new Map<string, { x: number; y: number }>();

  branches.forEach((b) => {
    const fi = families.indexOf(b.family);
    branchPositions.set(`${b.family}|${b.branch}`, { x: familyX(fi), y: 170 });
  });

  families.forEach((family, fi) => {
    const leaves = nodes.filter((n) => n.language.family === family);
    const cx = familyX(fi);
    const spread = 92;
    leaves.forEach((leaf, li) => {
      const offset = (li - (leaves.length - 1) / 2) * spread;
      leafPositions.set(leaf.language.code, { x: cx + offset, y: 290 });
    });
  });

  return (
    <div className="flex flex-col gap-4">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Language family graph"
      >
        {/* Root */}
        <text
          x={W / 2}
          y={34}
          textAnchor="middle"
          className="fill-[var(--subtle)] font-mono text-[11px]"
        >
          CommonMind · civic language layer
        </text>
        <circle cx={W / 2} cy={52} r={4} className="fill-[var(--foreground)]" />

        {families.map((family, fi) => {
          const x = familyX(fi);
          return (
            <g key={family}>
              <path
                d={`M ${W / 2} 56 C ${W / 2} 100, ${x} 90, ${x} 120`}
                fill="none"
                className="stroke-white/15"
              />
              <circle cx={x} cy={124} r={3} className="fill-white/50" />
              <text
                x={x + 8}
                y={128}
                textAnchor="start"
                className="fill-[var(--faint)] font-mono text-[10px]"
              >
                {family}
              </text>
            </g>
          );
        })}

        {branches.map((b) => {
          const p = branchPositions.get(`${b.family}|${b.branch}`)!;
          return (
            <g key={`${b.family}|${b.branch}`}>
              <line x1={p.x} y1={128} x2={p.x} y2={p.y - 4} className="stroke-white/15" />
              <text
                x={p.x + 8}
                y={p.y - 14}
                className="fill-[var(--subtle)] font-mono text-[10px]"
              >
                {b.branch}
              </text>
              <circle cx={p.x} cy={p.y} r={3} className="fill-white/50" />
            </g>
          );
        })}

        {nodes.map((n) => {
          const leaf = leafPositions.get(n.language.code)!;
          const branch = branchPositions.get(`${n.language.family}|${n.language.branch}`)!;
          const built = n.models > 0;
          const active = hovered === n.language.code;
          const dim = hovered !== null && !active;
          return (
            <g
              key={n.language.code}
              className={cn("transition-opacity duration-300", dim && "opacity-35")}
            >
              <path
                d={`M ${branch.x} ${branch.y + 4} C ${branch.x} ${branch.y + 60}, ${leaf.x} ${leaf.y - 70}, ${leaf.x} ${leaf.y - 16}`}
                fill="none"
                strokeDasharray={built ? undefined : "3 4"}
                className={built ? undefined : "stroke-white/20"}
                style={
                  built
                    ? { stroke: "color-mix(in oklch, var(--signal) 55%, transparent)" }
                    : undefined
                }
              />
              <Link
                href={`/languages/${n.language.code}`}
                onPointerEnter={() => setHovered(n.language.code)}
                onPointerLeave={() => setHovered(null)}
                onFocus={() => setHovered(n.language.code)}
                onBlur={() => setHovered(null)}
              >
                {built && (
                  <circle
                    cx={leaf.x}
                    cy={leaf.y}
                    r={14 + n.corpora}
                    fill="none"
                    className="stroke-[var(--signal)]"
                    strokeOpacity={0.45}
                  />
                )}
                <circle
                  cx={leaf.x}
                  cy={leaf.y}
                  r={built ? 7 : 5}
                  className={
                    built
                      ? "fill-[var(--signal)]"
                      : "fill-[var(--background)] stroke-white/40"
                  }
                />
                <text
                  x={leaf.x}
                  y={leaf.y + 38}
                  textAnchor="middle"
                  className="fill-[var(--foreground)] text-[13px]"
                >
                  {n.language.name}
                </text>
                <text
                  x={leaf.x}
                  y={leaf.y + 54}
                  textAnchor="middle"
                  className="fill-[var(--faint)] font-mono text-[10px]"
                >
                  {n.language.endonym}
                </text>
              </Link>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-8 text-xs text-faint">
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-signal" /> Models, corpora, and benchmarks
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full border border-white/40" /> Open for contributors
        </span>
      </div>
    </div>
  );
}

export { LanguageNetwork };
