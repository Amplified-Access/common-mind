type Metric = {
  value: string;
  label: string;
};

export type Model = {
  slug: string;
  name: string;
  tagline: string;
  platforms: string[];
  languages: string[];
  overview: string;
  metrics: Metric[];
  capabilities: string[];
  achievements: string[];
  usage: {
    language: string;
    code: string;
  };
};

export const models: Model[] = [
  {
    slug: "luganda-gemma-1b-it",
    name: "Luganda-gemma-1B-it",
    tagline:
      "Fine-tuned Gemma 3 1B Instruct for English to Luganda and Luganda to English translation",
    platforms: ["HuggingFace", "Kaggle", "Ollama"],
    languages: ["lg"],
    overview:
      "A fine-tuned version of Google Gemma 3 1B Instruct for English to Luganda, Luganda to English translation and Luganda conversational AI. Trained with QLoRA (4-bit quantization + LoRA adapters) runs on consumer GPUs. Only 52 MB adapter on top of the 1B base model, trained primarily on the Sunbird SALT parallel corpus covering agriculture, health, and society topics.",
    metrics: [
      { value: "13.85", label: "BLEU score" },
      { value: "46.59", label: "chrF++ score" },
      { value: "13.05M", label: "Trainable parameters" },
      { value: "256 tokens", label: "Context length" },
    ],
    capabilities: [
      "English to Luganda translation",
      "Luganda to English translation",
      "Luganda conversational AI",
      "Educational tools for Luganda language learning",
      "Low-resource African language NLP research",
    ],
    achievements: [
      "BLEU 13.85 on English to Luganda translation, up from 0.06 on the base model",
      "chrF++ 46.59 strong character level accuracy for morphologically rich Luganda",
      "Only 52 MB adapter on top of the 1B base model",
      "Runs on consumer GPUs with QLoRA (4-bit quantization and LoRA adapters)",
    ],
    usage: {
      language: "python",
      code: `from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftModel
import torch

base_model_id = "google/gemma-3-1b-it"
adapter_id = "AmplifiedAccess/Luganda-gemma-1b-it"

tokenizer = AutoTokenizer.from_pretrained(base_model_id)

model = AutoModelForCausalLM.from_pretrained(
    base_model_id,
    quantization_config=BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
    ),
    device_map={"": 0},
)
model = PeftModel.from_pretrained(model, adapter_id)
model.eval()

# Translate civic content English → Luganda
prompt = "Translate to Luganda:\\nA community officer can help residents complete forms, check eligibility, and even process applications offline."
messages = [{"role": "user", "content": prompt}]
inputs = tokenizer.apply_chat_template(
    messages, return_tensors="pt", return_dict=True, add_generation_prompt=True
).to(model.device)

with torch.no_grad():
    outputs = model.generate(**inputs, max_new_tokens=128, do_sample=False)

prompt_len = inputs["input_ids"].shape[1]
response = tokenizer.decode(outputs[0][prompt_len:], skip_special_tokens=True).strip()
print(response)`,
    },
  },
  {
    slug: "swahili-gemma-1b-it",
    name: "Swahili-gemma-1B-it",
    tagline: "Fine-tuned Gemma 3 1B for English to Swahili translation",
    platforms: ["HuggingFace", "Kaggle", "Ollama"],
    languages: ["sw"],
    overview:
      "A fine-tuned version of Google Gemma 3 1B, continued-pretrained and instruction-tuned for English to Swahili translation. Trained on 159K+ examples from MAFAND-MT, Sunbird SALT, Rogendo, Inkuba-Swahili-MMT, Aya, and Alpaca-Swahili, then merged to full weights. Also follows general Swahili instructions from its instruction-tuning data.",
    metrics: [
      { value: "28.86", label: "BLEU score" },
      { value: "54.77", label: "chrF++ score" },
      { value: "26.09M", label: "Trainable parameters" },
      { value: "512 tokens", label: "Context length" },
    ],
    capabilities: [
      "English to Swahili translation",
      "Swahili instruction-following and conversational use",
      "Low-resource African language NLP research",
    ],
    achievements: [
      "BLEU 28.86 on English to Swahili translation, up from 0.41 on the base model",
      "chrF++ 54.77, up from 14.28 on the base model",
      "26.09M trainable LoRA parameters, merged into a 1B model",
      "Quantized to ~814MB for CPU/consumer hardware via Ollama",
    ],
    usage: {
      language: "python",
      code: `from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

model_id = "AmplifiedAccess/Swahili-gemma-1b-it"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(model_id, dtype=torch.float16, device_map="auto")

prompt = ("<start_of_turn>user\\n"
          "Translate the following English sentence to Swahili.\\n"
          "English: The children are playing outside.\\nSwahili:<end_of_turn>\\n"
          "<start_of_turn>model\\n")

inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
with torch.no_grad():
    outputs = model.generate(**inputs, max_new_tokens=128, do_sample=False)

response = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)
print(response.strip())`,
    },
  },
  {
    slug: "swahili-nllb-1-3b",
    name: "Swahili-nllb-1.3B",
    tagline: "LoRA fine-tune of NLLB-200 1.3B for English to Swahili translation",
    platforms: ["HuggingFace"],
    languages: ["sw"],
    overview:
      "A LoRA fine-tune of Meta's facebook/nllb-200-distilled-1.3B, a purpose-built translation architecture (encoder-decoder, SentencePiece), for English to Swahili translation. Trained on 145K+ parallel pairs from MAFAND-MT, Sunbird SALT, Rogendo, and Inkuba-Swahili-MMT. Only 23.6M trainable LoRA parameters on top of the 1.3B base model.",
    metrics: [
      { value: "38.74", label: "BLEU score" },
      { value: "63.37", label: "chrF++ score" },
      { value: "23.6M", label: "Trainable parameters" },
      { value: "128 tokens", label: "Max sequence length" },
    ],
    capabilities: [
      "English to Swahili translation",
      "Low-resource African language NLP research",
    ],
    achievements: [
      "BLEU 38.74 / chrF++ 63.37 on FLORES devtest, beating the CraneAILabs Swahili-Gemma-1B reference (27.6 BLEU / 56.8 chrF++)",
      "Only 23.6M trainable LoRA parameters, ~1.7% of the 1.37B base model",
      "Purpose-built NLLB-200 translation architecture rather than a general-purpose chat LLM",
    ],
    usage: {
      language: "python",
      code: `import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftModel

base_model_id = "facebook/nllb-200-distilled-1.3B"
adapter_id = "AmplifiedAccess/Swahili-nllb-1.3b"

tokenizer = AutoTokenizer.from_pretrained(base_model_id, src_lang="eng_Latn")
model = AutoModelForSeq2SeqLM.from_pretrained(base_model_id)
model = PeftModel.from_pretrained(model, adapter_id)
model.eval()

text = "A community officer can help residents complete forms, check eligibility, and even process applications offline."
inputs = tokenizer(text, return_tensors="pt")
target_lang_id = tokenizer.convert_tokens_to_ids("swh_Latn")

with torch.no_grad():
    outputs = model.generate(**inputs, forced_bos_token_id=target_lang_id, max_new_tokens=128)

print(tokenizer.batch_decode(outputs, skip_special_tokens=True)[0])`,
    },
  },
  {
    slug: "swahili-nllb-600m",
    name: "Swahili-nllb-600M",
    tagline: "LoRA fine-tune of NLLB-200 600M for English to Swahili translation",
    platforms: ["HuggingFace"],
    languages: ["sw"],
    overview:
      "A LoRA fine-tune of Meta's facebook/nllb-200-distilled-600M, the smaller sibling of Swahili-nllb-1.3B, for English to Swahili translation. Trained on the same curated corpus mix (MAFAND-MT, Sunbird SALT, Rogendo, Inkuba-Swahili-MMT). Only 8.65M trainable LoRA parameters on top of the 615M base model, for tighter hardware budgets.",
    metrics: [
      { value: "35.97", label: "BLEU score" },
      { value: "61.26", label: "chrF++ score" },
      { value: "8.65M", label: "Trainable parameters" },
      { value: "128 tokens", label: "Max sequence length" },
    ],
    capabilities: [
      "English to Swahili translation",
      "Low-resource African language NLP research",
    ],
    achievements: [
      "BLEU 35.97 / chrF++ 61.26 on FLORES devtest, beating the CraneAILabs Swahili-Gemma-1B reference (27.6 BLEU / 56.8 chrF++) at under half the parameters",
      "Only 8.65M trainable LoRA parameters, ~1.4% of the 615M base model",
      "Runs on more constrained hardware than the 1.3B variant",
    ],
    usage: {
      language: "python",
      code: `import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftModel

base_model_id = "facebook/nllb-200-distilled-600M"
adapter_id = "AmplifiedAccess/Swahili-nllb-600m"

tokenizer = AutoTokenizer.from_pretrained(base_model_id, src_lang="eng_Latn")
model = AutoModelForSeq2SeqLM.from_pretrained(base_model_id)
model = PeftModel.from_pretrained(model, adapter_id)
model.eval()

text = "A community officer can help residents complete forms, check eligibility, and even process applications offline."
inputs = tokenizer(text, return_tensors="pt")
target_lang_id = tokenizer.convert_tokens_to_ids("swh_Latn")

with torch.no_grad():
    outputs = model.generate(**inputs, forced_bos_token_id=target_lang_id, max_new_tokens=128)

print(tokenizer.batch_decode(outputs, skip_special_tokens=True)[0])`,
    },
  },
];
