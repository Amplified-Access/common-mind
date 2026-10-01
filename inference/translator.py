# CommonMind translation worker — serves all four published models behind
# one GPU-warm worker. Prompt formats below are copied verbatim from each
# model's published usage example (components/models/data.ts in the main
# repo) — this is the same, already-verified inference code, not a new
# implementation.
#
# Constants and imports live INSIDE the class body/methods, not at module
# level — flash dev ships only the decorated body, so a module-level name
# raises NameError under `flash dev` even though `flash deploy` (which
# imports the whole module) would mask it. See the flash skill's Gotcha #1.
#
# run with: flash dev
# test directly: python translator.py
import os
from pathlib import Path


def _load_hf_token() -> str:
    # os.environ / .env loading order is ambiguous across flash's dev vs
    # deploy paths, so read straight from the same on-disk token `hf auth
    # login` already wrote — unambiguous either way.
    env_token = os.environ.get("HF_TOKEN")
    if env_token:
        return env_token
    token_path = Path.home() / ".cache" / "huggingface" / "token"
    return token_path.read_text().strip() if token_path.exists() else ""


from runpod_flash import DataCenter, Endpoint, GpuGroup, NetworkVolume

# Without persistent storage a scaled-to-zero worker re-downloads all four
# models (~13GB) from HuggingFace on every cold start, which means minutes
# of waiting for the first visitor after any idle period. Caching the
# weights on a volume turns that into a local disk read. The volume pins
# the endpoint to one datacenter, so both must name the same one.
MODEL_CACHE = NetworkVolume(name="commonmind-model-cache", size=25)


@Endpoint(
    name="commonmind-translator",
    gpu=GpuGroup.AMPERE_16,
    workers=(0, 1),
    idle_timeout=300,
    datacenter=DataCenter.EU_RO_1,
    volume=MODEL_CACHE,
    env={
        # google/gemma-3-1b-it is a gated HF repo — the worker needs a token
        # (already accepted the license under this account) to download it.
        "HF_TOKEN": _load_hf_token(),
        "HF_HUB_CACHE": "/runpod-volume/models",
    },
    dependencies=[
        "torch",
        "transformers",
        "peft",
        "accelerate",
        "sentencepiece",
        "bitsandbytes",
    ],
)
class Translator:
    def __init__(self):
        # Loads once per worker; every request after cold start reuses these.
        import torch
        from transformers import (
            AutoModelForCausalLM,
            AutoModelForSeq2SeqLM,
            AutoTokenizer,
            BitsAndBytesConfig,
        )
        from peft import PeftModel

        GEMMA_BASE = "google/gemma-3-1b-it"
        LUGANDA_ADAPTER = "AmplifiedAccess/Luganda-gemma-1b-it"
        SWAHILI_GEMMA = "AmplifiedAccess/Swahili-gemma-1b-it"
        NLLB_600M_BASE = "facebook/nllb-200-distilled-600M"
        NLLB_600M_ADAPTER = "AmplifiedAccess/Swahili-nllb-600m"
        NLLB_1_3B_BASE = "facebook/nllb-200-distilled-1.3B"
        NLLB_1_3B_ADAPTER = "AmplifiedAccess/Swahili-nllb-1.3b"

        self.torch = torch

        # Luganda-gemma-1b-it: QLoRA adapter over the Gemma base, exactly as
        # published — 4-bit NF4 base + LoRA, per the model card.
        self.luganda_tokenizer = AutoTokenizer.from_pretrained(GEMMA_BASE)
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
        self.luganda_model = PeftModel.from_pretrained(luganda_base, LUGANDA_ADAPTER)
        self.luganda_model.eval()

        # Swahili-gemma-1b-it: fully merged model, no adapter needed.
        self.swahili_gemma_tokenizer = AutoTokenizer.from_pretrained(SWAHILI_GEMMA)
        self.swahili_gemma_model = AutoModelForCausalLM.from_pretrained(
            SWAHILI_GEMMA, dtype=torch.float16, device_map="auto"
        )
        self.swahili_gemma_model.eval()

        # Swahili-nllb-600M / 1.3B: LoRA adapters over the NLLB-200 bases.
        self.nllb_600m_tokenizer = AutoTokenizer.from_pretrained(
            NLLB_600M_BASE, src_lang="eng_Latn"
        )
        nllb_600m_base = AutoModelForSeq2SeqLM.from_pretrained(NLLB_600M_BASE)
        self.nllb_600m_model = PeftModel.from_pretrained(nllb_600m_base, NLLB_600M_ADAPTER)
        self.nllb_600m_model.eval()

        self.nllb_1_3b_tokenizer = AutoTokenizer.from_pretrained(
            NLLB_1_3B_BASE, src_lang="eng_Latn"
        )
        nllb_1_3b_base = AutoModelForSeq2SeqLM.from_pretrained(NLLB_1_3B_BASE)
        self.nllb_1_3b_model = PeftModel.from_pretrained(nllb_1_3b_base, NLLB_1_3B_ADAPTER)
        self.nllb_1_3b_model.eval()

    def _translate_luganda(self, text: str, direction: str) -> str:
        prompt = (
            f"Translate to Luganda:\n{text}"
            if direction != "lg-en"
            else f"Translate to English:\n{text}"
        )
        messages = [{"role": "user", "content": prompt}]
        inputs = self.luganda_tokenizer.apply_chat_template(
            messages, return_tensors="pt", return_dict=True, add_generation_prompt=True
        ).to(self.luganda_model.device)

        with self.torch.no_grad():
            outputs = self.luganda_model.generate(
                **inputs, max_new_tokens=128, do_sample=False
            )

        prompt_len = inputs["input_ids"].shape[1]
        return self.luganda_tokenizer.decode(
            outputs[0][prompt_len:], skip_special_tokens=True
        ).strip()

    def _translate_swahili_gemma(self, text: str) -> str:
        prompt = (
            "<start_of_turn>user\n"
            "Translate the following English sentence to Swahili.\n"
            f"English: {text}\nSwahili:<end_of_turn>\n"
            "<start_of_turn>model\n"
        )
        inputs = self.swahili_gemma_tokenizer(prompt, return_tensors="pt").to(
            self.swahili_gemma_model.device
        )

        with self.torch.no_grad():
            outputs = self.swahili_gemma_model.generate(
                **inputs, max_new_tokens=128, do_sample=False
            )

        return self.swahili_gemma_tokenizer.decode(
            outputs[0][inputs["input_ids"].shape[1] :], skip_special_tokens=True
        ).strip()

    def _translate_nllb(self, model, tokenizer, text: str) -> str:
        inputs = tokenizer(text, return_tensors="pt").to(model.device)
        target_lang_id = tokenizer.convert_tokens_to_ids("swh_Latn")

        with self.torch.no_grad():
            outputs = model.generate(
                **inputs, forced_bos_token_id=target_lang_id, max_new_tokens=128
            )

        return tokenizer.batch_decode(outputs, skip_special_tokens=True)[0].strip()

    async def translate(self, model_slug: str, text: str, direction: str = "") -> dict:
        SUPPORTED_MODELS = {
            "luganda-gemma-1b-it",
            "swahili-gemma-1b-it",
            "swahili-nllb-1-3b",
            "swahili-nllb-600m",
        }

        text = (text or "").strip()
        if not text:
            return {"error": "text is required"}
        if len(text) > 500:
            return {"error": "text must be 500 characters or fewer"}
        if model_slug not in SUPPORTED_MODELS:
            return {"error": f"unknown model_slug: {model_slug}"}

        try:
            if model_slug == "luganda-gemma-1b-it":
                translation = self._translate_luganda(text, direction)
            elif model_slug == "swahili-gemma-1b-it":
                translation = self._translate_swahili_gemma(text)
            elif model_slug == "swahili-nllb-1-3b":
                translation = self._translate_nllb(
                    self.nllb_1_3b_model, self.nllb_1_3b_tokenizer, text
                )
            else:  # swahili-nllb-600m
                translation = self._translate_nllb(
                    self.nllb_600m_model, self.nllb_600m_tokenizer, text
                )
        except Exception as e:  # surface a real error to the caller, don't fail silently
            return {"error": f"inference failed: {e}"}

        return {"translation": translation, "model_slug": model_slug}


if __name__ == "__main__":
    import asyncio

    async def _smoke_test():
        t = Translator()
        print(
            await t.translate(
                model_slug="swahili-gemma-1b-it",
                text="The children are playing outside.",
            )
        )

    asyncio.run(_smoke_test())
