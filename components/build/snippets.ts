// Code shown on the Build page. Every snippet runs against the released
// models and the reference inference server as published.

export const quickstart = `from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftModel

base = "facebook/nllb-200-distilled-600M"
tok = AutoTokenizer.from_pretrained(base, src_lang="eng_Latn")
model = PeftModel.from_pretrained(
    AutoModelForSeq2SeqLM.from_pretrained(base),
    "AmplifiedAccess/Swahili-nllb-600m",
)

inputs = tok("The clinic has had no medicine for two weeks.", return_tensors="pt")
out = model.generate(
    **inputs,
    forced_bos_token_id=tok.convert_tokens_to_ids("swh_Latn"),
    max_new_tokens=128,
)
print(tok.decode(out[0], skip_special_tokens=True))`;

export const journey = [
  {
    id: "discover",
    label: "Discover",
    copy: "Explore available models, supported languages, capabilities, and evaluation results.",
    lang: "bash",
    title: "terminal",
    code: `curl -s "https://huggingface.co/api/models?author=AmplifiedAccess" \\
  | jq '.[].id'`,
  },
  {
    id: "install",
    label: "Install",
    copy: "Access model weights, adapters, and dependencies through familiar developer tools.",
    lang: "bash",
    title: "terminal",
    code: `pip install transformers peft torch sentencepiece accelerate
# Luganda (4-bit) also needs:
pip install bitsandbytes`,
  },
  {
    id: "run",
    label: "Run",
    copy: "Test model inference locally with your own inputs.",
    lang: "bash",
    title: "terminal",
    code: `ollama run amplifiedaccessorg/Swahili-gemma-1b-it`,
  },
  {
    id: "build",
    label: "Build",
    copy: "Integrate language capabilities into applications and workflows.",
    lang: "ts",
    title: "app/report.ts",
    code: `const res = await fetch(\`\${process.env.COMMONMIND_URL}/translate\`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": process.env.COMMONMIND_KEY!,
  },
  body: JSON.stringify({
    model_slug: "luganda-gemma-1b-it",
    direction: "lg-en",
    text: report.body,
  }),
});

const { translation } = await res.json();`,
  },
  {
    id: "deploy",
    label: "Deploy",
    copy: "Run models in production using infrastructure suited to your application.",
    lang: "bash",
    title: "inference/server.py",
    code: `pip install fastapi uvicorn transformers peft accelerate sentencepiece bitsandbytes

HF_TOKEN=<hf-token> TRANSLATE_API_KEY=<secret> \\
  uvicorn server:app --host 0.0.0.0 --port 8000

curl localhost:8000/health
# {"status":"ok","models_loaded":[...]}`,
  },
];

export const paths = [
  {
    id: "python",
    label: "Python",
    copy: "Transformers + PEFT.",
    lang: "python",
    title: "translate.py",
    code: quickstart,
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    copy: "Weights and model cards on the Hub.",
    lang: "bash",
    title: "terminal",
    code: `# Download weights for offline / air-gapped use
hf download AmplifiedAccess/Swahili-nllb-1.3b
hf download AmplifiedAccess/Luganda-gemma-1b-it

# Model cards include training data, method, and evaluation
open https://huggingface.co/AmplifiedAccess`,
  },
  {
    id: "ollama",
    label: "Ollama",
    copy: "Quantized builds for laptops and CPUs.",
    lang: "bash",
    title: "terminal",
    code: `ollama pull amplifiedaccessorg/Swahili-gemma-1b-it
ollama pull amplifiedaccessorg/Luganda-gemma-1b-it

ollama run amplifiedaccessorg/Luganda-gemma-1b-it`,
  },
  {
    id: "api",
    label: "API",
    copy: "One endpoint for every model.",
    lang: "bash",
    title: "POST /translate",
    code: `curl -X POST "$COMMONMIND_URL/translate" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: $COMMONMIND_KEY" \\
  -d '{
    "model_slug": "swahili-nllb-1-3b",
    "text": "Residents report that the borehole has been broken since March."
  }'

# {"translation": "...", "model_slug": "swahili-nllb-1-3b"}`,
  },
  {
    id: "local",
    label: "Local",
    copy: "Your machine or a single GPU.",
    lang: "bash",
    title: "terminal",
    code: `pip install fastapi uvicorn transformers peft accelerate sentencepiece bitsandbytes

cd inference
HF_TOKEN=<hf-token> TRANSLATE_API_KEY=dev \\
  uvicorn server:app --port 8000`,
  },
  {
    id: "edge",
    label: "Edge",
    copy: "Under 1 GB, offline after first pull.",
    lang: "bash",
    title: "terminal",
    code: `# CPU-only device, offline after first pull
ollama pull amplifiedaccessorg/Swahili-gemma-1b-it

# Serve on the local network
OLLAMA_HOST=0.0.0.0 ollama serve`,
  },
];
