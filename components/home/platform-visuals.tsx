import { BarChart } from "@/components/benchmarks/bar-chart";
import { swahiliFlores } from "@/components/benchmarks/data";
import { languages } from "@/components/languages/data";
import { registryModels } from "@/components/models/registry";
import { ParticleOrb } from "@/components/system/particle-orb";
import { TagChain } from "@/components/system/tag-chain";
import { cn } from "@/lib/utils";

import { SpeechOrb } from "./speech-orb";

// The orb's radius as a share of half its box; the labels ring it at this.
const ORB_SCALE = 0.8;

// Each label's angle round the orb, in degrees clockwise from 3 o'clock, as
// placed in the mock.
const LABEL_ANGLES: Record<string, number> = {
  lg: -108,
  din: -77,
  sw: -157,
  om: -17,
  luo: 156,
  rw: 35,
};

// Pinned to the orb's rim: the point on the label nearest the orb's centre
// sits on the rim, as in the mock.
const labelPosition = (degrees: number): React.CSSProperties => {
  const a = (degrees * Math.PI) / 180;
  const x = Math.cos(a);
  const y = Math.sin(a);
  const r = ORB_SCALE * 50;
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    left: `${round(50 + x * r)}%`,
    top: `${round(50 + y * r)}%`,
    transform: `translate(${round(-50 + 50 * x)}%, ${round(-50 + 50 * y)}%)`,
  };
};

const CODE_SAMPLE = `quantization_config=BitsAndBytesConfig( load_in_4bit=True, bnb_4bit_quant_type="nf4",
bnb_4bit_compute_dtype=torch.bfloat16, ), device_map={"": 0},)
model = PeftModel.from_pretrained(model, adapter_id) # Translate civic content English → Luganda
prompt = "Translate to Luganda:\\nA community officer can help residents complete forms, check
eligibility, and even process applications offline."`;

function LanguagesVisual() {
  return (
    <div className="relative size-full">
      <div className="absolute top-[45%] left-1/2 aspect-square h-[62%] -translate-1/2">
        <ParticleOrb variant="shell" settings={{ scale: ORB_SCALE }} className="aspect-auto size-full" />
        {languages.map((language, i) => (
          <span
            key={language.code}
            className="absolute border border-line-strong bg-tag px-3 py-1 text-base whitespace-nowrap text-foreground"
            style={labelPosition(LABEL_ANGLES[language.code] ?? i * 60)}
          >
            {language.endonym === "Kiswahili" ? "Kiswahili" : language.name}
          </span>
        ))}
      </div>
      <pre aria-hidden className="absolute inset-x-[10%] bottom-[6%] font-mono text-[9px] leading-relaxed whitespace-pre-wrap text-foreground/45">
        {CODE_SAMPLE}
      </pre>
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
      {/* Centred a little above the middle, as in the mock. */}
      <SpeechOrb className="absolute inset-x-0 -top-[7%] h-full" />
      <div className="absolute inset-x-[7%] top-[7%] flex justify-between font-mono text-[10px] leading-[2] text-foreground/85">
        {SPEECH_META.map((lines) => (
          <p key={lines[0]} className="flex flex-col">
            {lines.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </p>
        ))}
      </div>
      <TagChain tags={SPEECH_STAGES} uppercase className="absolute inset-x-[7%] top-[70%] justify-center" />
      <pre aria-hidden className="absolute inset-x-[7%] bottom-[6%] font-mono text-[9px] leading-relaxed whitespace-pre-wrap text-foreground/45">
        {CODE_SAMPLE}
      </pre>
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

// Deterministic dot field for an abstract map: no real geography and no
// real reports.
const GRID = 40;
const CLUSTERS: [number, number, number][] = [
  [12, 14, 5.5],
  [28, 10, 4.4],
  [24, 28, 4.8],
  [9, 30, 3.6],
  [34, 23, 3.2],
];
const DOTS = Array.from({ length: GRID * GRID }, (_, i) => {
  const x = i % GRID;
  const y = Math.floor(i / GRID);
  const n = Math.abs(Math.sin(x * 7.13 + y * 3.71) * 9301.17) % 1;
  const cluster = CLUSTERS.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) < r);
  return { x, y, lit: cluster && n > 0.35, dim: n > 0.55, delay: Math.round((i % 13) * 27) / 100 };
});

const FLOW = ["Community reports", "CommonMind", "Structured evidence", "Live map"];

function ApplicationsVisual() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-6 p-8">
      <svg aria-hidden viewBox={`0 0 ${GRID} ${GRID}`} className="aspect-square h-[70%] max-h-80">
        {DOTS.map((dot, i) => (
          <circle
            key={i}
            cx={dot.x + 0.5}
            cy={dot.y + 0.5}
            r={0.26}
            className={cn(dot.lit ? "fill-signal" : dot.dim ? "fill-white/12" : "fill-white/5")}
            style={dot.lit ? { animation: `cm-pulse 3.2s ease-in-out ${dot.delay}s infinite` } : undefined}
          />
        ))}
      </svg>
      <ol className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-xs">
        {FLOW.map((step, i) => (
          <li key={step} className="flex items-center gap-3">
            <span className={step === "CommonMind" ? "text-signal" : "text-subtle"}>{step}</span>
            {i < FLOW.length - 1 && <span className="text-faint">→</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

export { ApplicationsVisual, CivicSpeechVisual, EvaluationVisual, LanguagesVisual, ModelsVisual };
