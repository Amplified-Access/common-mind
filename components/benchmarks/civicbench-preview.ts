// PLACEHOLDER DATA. CivicBench Africa results are not published yet: these
// values only lay out the comparison chart until the evaluation runs. The
// page labels the chart as sample data; replace every score here with
// measured results (and drop the label) when they exist. The Translation
// axis is the exception: radarScores() fills it with each model's real
// chrF++.

export const radarAxes = [
  "Speech Recognition",
  "Terminology",
  "Classification",
  "Translation",
  "Context Sensitivity",
] as const;

export type RadarScores = Record<(typeof radarAxes)[number], number>;

type PreviewScores = Omit<RadarScores, "Translation">;

const civicBenchPreview: Record<string, PreviewScores> = {
  "luganda-gemma-1b-it": {
    "Speech Recognition": 45,
    Terminology: 50,
    Classification: 62,
    "Context Sensitivity": 70,
  },
  "swahili-gemma-1b-it": {
    "Speech Recognition": 40,
    Terminology: 58,
    Classification: 55,
    "Context Sensitivity": 60,
  },
  "swahili-nllb-1-3b": {
    "Speech Recognition": 20,
    Terminology: 82,
    Classification: 30,
    "Context Sensitivity": 35,
  },
  "swahili-nllb-600m": {
    "Speech Recognition": 18,
    Terminology: 74,
    Classification: 28,
    "Context Sensitivity": 32,
  },
};

export function radarScores(slug: string, chrf: number): RadarScores | undefined {
  const preview = civicBenchPreview[slug];
  return preview && { ...preview, Translation: chrf };
}
