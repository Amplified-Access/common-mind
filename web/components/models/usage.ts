import { playgroundModels } from "@/components/playground/data";

import type { RegistryModel } from "./registry";

export type UsagePath = {
  id: string;
  label: string;
  language: string;
  title: string;
  code: string;
};

// The ways to run one model, generated from its registry entry. Paths that
// don't apply (Ollama for a model that isn't published there) are left out.
export function usagePaths(model: RegistryModel): UsagePath[] {
  const ollama = model.availability.find((a) => a.label === "Ollama")?.href;
  const ollamaId = ollama?.replace("https://ollama.com/", "");
  const direction =
    playgroundModels.find((m) => m.slug === model.slug)?.directions[0]?.code;

  const paths: UsagePath[] = [
    {
      id: "python",
      label: "Python",
      language: model.usage.language,
      title: "inference.py",
      code: model.usage.code,
    },
    {
      id: "huggingface",
      label: "Hugging Face",
      language: "bash",
      title: "terminal",
      code: `# Download the weights for offline or air-gapped use
hf download ${model.hfId}
hf download ${model.base.id}

# The model card covers training data, method, and evaluation
open https://huggingface.co/${model.hfId}`,
    },
  ];

  if (ollamaId) {
    paths.push({
      id: "ollama",
      label: "Ollama",
      language: "bash",
      title: "terminal",
      code: `ollama pull ${ollamaId}
ollama run ${ollamaId}`,
    });
  }

  paths.push(
    {
      id: "api",
      label: "API",
      language: "bash",
      title: "POST /translate",
      code: `curl -X POST "$COMMONMIND_URL/translate" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: $COMMONMIND_KEY" \\
  -d '{
    "model_slug": "${model.slug}",${direction ? `\n    "direction": "${direction}",` : ""}
    "text": "Residents report that the borehole has been broken since March."
  }'`,
    },
    {
      id: "local",
      label: "Local",
      language: "bash",
      title: "inference/server.py",
      code: `pip install fastapi uvicorn transformers peft accelerate sentencepiece bitsandbytes

cd inference
HF_TOKEN=<hf-token> TRANSLATE_API_KEY=dev \\
  uvicorn server:app --port 8000`,
    },
  );

  if (ollamaId) {
    paths.push({
      id: "edge",
      label: "Edge",
      language: "bash",
      title: "terminal",
      code: `# CPU-only device, offline after the first pull
ollama pull ${ollamaId}

# Serve it on the local network
OLLAMA_HOST=0.0.0.0 ollama serve`,
    });
  }

  return paths;
}
