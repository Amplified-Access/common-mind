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
    lang: "bash",
    title: "terminal",
    code: `curl -s "https://huggingface.co/api/models?author=AmplifiedAccess" \\
  | jq '.[].id'`,
  },
  {
    id: "install",
    lang: "bash",
    title: "terminal",
    code: `pip install transformers peft torch sentencepiece accelerate
# Luganda (4-bit) also needs:
pip install bitsandbytes`,
  },
  {
    id: "run",
    lang: "bash",
    title: "terminal",
    code: `ollama run amplifiedaccessorg/Swahili-gemma-1b-it`,
  },
  {
    id: "build",
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
    lang: "bash",
    title: "inference/server.py",
    code: `pip install fastapi uvicorn transformers peft accelerate sentencepiece bitsandbytes

HF_TOKEN=<hf-token> TRANSLATE_API_KEY=<secret> \\
  uvicorn server:app --host 0.0.0.0 --port 8000

curl localhost:8000/health
# {"status":"ok","models_loaded":[...]}`,
  },
] as const;

export const apiResponse = `{
  "translation": "...",
  "model_slug": "swahili-nllb-1-3b"
}`;

export const paths = [
  {
    id: "python",
    lang: "python",
    title: "translate.py",
    code: quickstart,
  },
  {
    id: "huggingface",
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
    lang: "bash",
    title: "terminal",
    code: `ollama pull amplifiedaccessorg/Swahili-gemma-1b-it
ollama pull amplifiedaccessorg/Luganda-gemma-1b-it

ollama run amplifiedaccessorg/Luganda-gemma-1b-it`,
  },
  {
    id: "api",
    lang: "bash",
    title: "POST /translate",
    code: `curl -X POST "$COMMONMIND_URL/translate" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: $COMMONMIND_KEY" \\
  -d '{
    "model_slug": "swahili-nllb-1-3b",
    "text": "Residents report that the borehole has been broken since March."
  }'`,
  },
  {
    id: "local",
    lang: "bash",
    title: "terminal",
    code: `pip install fastapi uvicorn transformers peft accelerate sentencepiece bitsandbytes

cd inference
HF_TOKEN=<hf-token> TRANSLATE_API_KEY=dev \\
  uvicorn server:app --port 8000`,
  },
  {
    id: "edge",
    lang: "bash",
    title: "terminal",
    code: `# CPU-only device, offline after first pull
ollama pull amplifiedaccessorg/Swahili-gemma-1b-it

# Serve on the local network
OLLAMA_HOST=0.0.0.0 ollama serve`,
  },
] as const;
