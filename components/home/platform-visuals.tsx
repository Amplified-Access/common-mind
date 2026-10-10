import { BarChart } from "@/components/benchmarks/bar-chart";
import { swahiliFlores } from "@/components/benchmarks/data";
import { registryModels } from "@/components/models/registry";
import { ParticleOrb } from "@/components/system/particle-orb";
import { TagChain } from "@/components/system/tag-chain";

import { ApplicationFlipper } from "./application-flipper";
import { LanguageTypewriter } from "./language-typewriter";
import { SpeechOrb } from "./speech-orb";

// The languages WatchTower translates into, each in its own name and
// script, in its language selector's order, leaving out English and French.
const TRANSLATION_LANGUAGES = [
  "Kiswahili",
  "Luganda",
  "Kinyarwanda",
  "አማርኛ",
  "ਪੰਜਾਬੀ",
  "اردو",
  "Kikuyu",
  "Sukuma",
  "Dholuo",
  "Afaan Oromoo",
  "Thuɔŋjäŋ",
];

function LanguagesVisual() {
  return (
    <div className="relative size-full">
      <div className="absolute top-1/2 left-1/2 flex aspect-square h-[74%] -translate-1/2 items-center justify-center">
        <ParticleOrb variant="shell" settings={{ scale: 0.8 }} className="absolute inset-0 aspect-auto size-full" />
        {/* One language at a time, typed out in the middle of the orb. */}
        <LanguageTypewriter
          names={TRANSLATION_LANGUAGES}
          className="relative text-[1.75rem] leading-none tracking-[-0.01em] text-foreground"
        />
      </div>
    </div>
  );
}

const SPEECH_META = [
  ["Language: Luganda", "Input: Speech"],
  ["Domain: Public Services", "Confidence: -"],
];

const SPEECH_STAGES = ["Voice", "Transcription", "Expression", "Context"];

function CivicSpeechVisual() {
  return (
    <div className="relative size-full">
      {/* Centred a little above the middle, so the tag chain crosses its
          lower half. */}
      <SpeechOrb className="absolute inset-x-0 -top-[4%] h-full" />
      <div className="absolute inset-x-[7%] top-[7%] flex justify-between font-mono text-[10px] leading-[2] text-foreground/85">
        {SPEECH_META.map((lines) => (
          <p key={lines[0]} className="flex flex-col">
            {lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        ))}
      </div>
      <TagChain tags={SPEECH_STAGES} uppercase className="absolute inset-x-[7%] top-[74%] justify-center" />
    </div>
  );
}

function ModelsVisual() {
  return (
    <div className="flex size-full flex-col justify-center gap-1 px-8 sm:px-12">
      {registryModels.map((m) => (
        <div key={m.slug} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-6 border-b border-line py-4 last:border-b-0">
          <span className="flex flex-col gap-1">
            <span className="text-lg">{m.name}</span>
            <span className="font-mono text-xs text-faint">
              {m.base.params} · {m.directions.join(", ")}
            </span>
          </span>
          <span className="text-right font-mono">
            <span className="text-2xl text-signal tabular-nums">{m.evaluation.bleu.toFixed(2)}</span>
            <span className="block text-[10px] text-faint">BLEU</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function EvaluationVisual() {
  const top = [...swahiliFlores.entries].sort((a, b) => b.bleu - a.bleu).slice(0, 6);
  return (
    <div className="flex size-full flex-col justify-center gap-5 px-8 sm:px-12">
      <BarChart title="BLEU" entries={top} metric="bleu" />
      <p className="font-mono text-[11px] text-faint">English → Swahili · {swahiliFlores.evalSet}</p>
    </div>
  );
}

function ApplicationsVisual() {
  return (
    <div className="flex size-full items-center justify-center p-8">
      <ApplicationFlipper className="w-[72%] max-w-md" />
    </div>
  );
}

export { ApplicationsVisual, CivicSpeechVisual, EvaluationVisual, LanguagesVisual, ModelsVisual };
