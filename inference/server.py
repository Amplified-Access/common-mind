# CommonMind translation server — runs on a Runpod GPU pod behind its HTTP
# proxy, serving all four published models from one warm process.
#
# The per-model prompt handling below is the same already-verified inference
# code used in translator.py (and copied from each model's published usage
# example), so behaviour matches what the model cards document.
#
# Start with:
#   TRANSLATE_API_KEY=... uvicorn server:app --host 0.0.0.0 --port 8000
import os

import torch
from fastapi import FastAPI, Header, HTTPException
from peft import PeftModel
from pydantic import BaseModel
from transformers import (
    AutoModelForCausalLM,
    AutoModelForSeq2SeqLM,
    AutoTokenizer,
    BitsAndBytesConfig,
)

GEMMA_BASE = "google/gemma-3-1b-it"
LUGANDA_ADAPTER = "AmplifiedAccess/Luganda-gemma-1b-it"
SWAHILI_GEMMA = "AmplifiedAccess/Swahili-gemma-1b-it"
NLLB_600M_BASE = "facebook/nllb-200-distilled-600M"
NLLB_600M_ADAPTER = "AmplifiedAccess/Swahili-nllb-600m"
NLLB_1_3B_BASE = "facebook/nllb-200-distilled-1.3B"
NLLB_1_3B_ADAPTER = "AmplifiedAccess/Swahili-nllb-1.3b"

SUPPORTED_MODELS = {
    "luganda-gemma-1b-it",
    "swahili-gemma-1b-it",
    "swahili-nllb-1-3b",
    "swahili-nllb-600m",
}
MAX_CHARS = 500

API_KEY = os.environ.get("TRANSLATE_API_KEY", "")

app = FastAPI()
models = {}


class TranslateRequest(BaseModel):
    model_slug: str
    text: str
    direction: str = ""


@app.on_event("startup")
def load_models():
    # Loaded once at process start; every request reuses these.
    luganda_tokenizer = AutoTokenizer.from_pretrained(GEMMA_BASE)
    luganda_base = AutoModelForCausalLM.from_pretrained(
        GEMMA_BASE,
        quantization_config=BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
            bnb_4bit_use_double_quant=True,
        ),
        device_map={"": 0},
    )
    luganda_model = PeftModel.from_pretrained(luganda_base, LUGANDA_ADAPTER)
    luganda_model.eval()
    models["luganda"] = (luganda_model, luganda_tokenizer)

    sw_tokenizer = AutoTokenizer.from_pretrained(SWAHILI_GEMMA)
    sw_model = AutoModelForCausalLM.from_pretrained(
        SWAHILI_GEMMA, dtype=torch.float16, device_map="auto"
    )
    sw_model.eval()
    models["swahili_gemma"] = (sw_model, sw_tokenizer)

    for key, base, adapter in (
        ("nllb_600m", NLLB_600M_BASE, NLLB_600M_ADAPTER),
        ("nllb_1_3b", NLLB_1_3B_BASE, NLLB_1_3B_ADAPTER),
    ):
        tok = AutoTokenizer.from_pretrained(base, src_lang="eng_Latn")
        base_model = AutoModelForSeq2SeqLM.from_pretrained(base).to("cuda")
        model = PeftModel.from_pretrained(base_model, adapter)
        model.eval()
        models[key] = (model, tok)

    print("ALL MODELS LOADED", flush=True)


def _translate_luganda(text: str, direction: str) -> str:
    model, tokenizer = models["luganda"]
    prompt = (
        f"Translate to Luganda:\n{text}"
        if direction != "lg-en"
        else f"Translate to English:\n{text}"
    )
    inputs = tokenizer.apply_chat_template(
        [{"role": "user", "content": prompt}],
        return_tensors="pt",
        return_dict=True,
        add_generation_prompt=True,
    ).to(model.device)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=128, do_sample=False)
    prompt_len = inputs["input_ids"].shape[1]
    return tokenizer.decode(outputs[0][prompt_len:], skip_special_tokens=True).strip()


def _translate_swahili_gemma(text: str) -> str:
    model, tokenizer = models["swahili_gemma"]
    prompt = (
        "<start_of_turn>user\n"
        "Translate the following English sentence to Swahili.\n"
        f"English: {text}\nSwahili:<end_of_turn>\n"
        "<start_of_turn>model\n"
    )
    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=128, do_sample=False)
    return tokenizer.decode(
        outputs[0][inputs["input_ids"].shape[1] :], skip_special_tokens=True
    ).strip()


def _translate_nllb(key: str, text: str) -> str:
    model, tokenizer = models[key]
    inputs = tokenizer(text, return_tensors="pt").to(model.device)
    target_lang_id = tokenizer.convert_tokens_to_ids("swh_Latn")
    with torch.no_grad():
        outputs = model.generate(
            **inputs, forced_bos_token_id=target_lang_id, max_new_tokens=128
        )
    return tokenizer.batch_decode(outputs, skip_special_tokens=True)[0].strip()


@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": sorted(models.keys())}


@app.post("/translate")
def translate(req: TranslateRequest, x_api_key: str = Header(default="")):
    if not API_KEY or x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="invalid api key")

    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > MAX_CHARS:
        raise HTTPException(
            status_code=400, detail=f"text must be {MAX_CHARS} characters or fewer"
        )
    if req.model_slug not in SUPPORTED_MODELS:
        raise HTTPException(status_code=400, detail="unknown model")
    if not models:
        raise HTTPException(status_code=503, detail="models still loading")

    if req.model_slug == "luganda-gemma-1b-it":
        translation = _translate_luganda(text, req.direction)
    elif req.model_slug == "swahili-gemma-1b-it":
        translation = _translate_swahili_gemma(text)
    elif req.model_slug == "swahili-nllb-1-3b":
        translation = _translate_nllb("nllb_1_3b", text)
    else:
        translation = _translate_nllb("nllb_600m", text)

    return {"translation": translation, "model_slug": req.model_slug}
