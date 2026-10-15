type Metric = {
  value: string;
  label: string;
};

// Each model's written copy, keyed by registry slug (registry.ts owns the
// model itself).
export type ModelCopy = {
  slug: string;
  tagline: string;
  overview: string;
  metrics: Metric[];
  capabilities: string[];
  achievements: string[];
  usage: {
    language: string;
    code: string;
  };
};

export const modelCopy: ModelCopy[] = [
  {
    slug: "luganda-gemma-1b-it",
    tagline:
      "A Gemma 3 1B Instruct model adapted using QLoRA for English to Luganda and Luganda to English translation",
    overview:
      "Built on Google's Gemma 3 1B Instruct architecture, this model uses QLoRA fine-tuning to improve English-to-Luganda and Luganda-to-English translation. It was trained primarily on the Sunbird SALT parallel corpus, covering agriculture, health, and society, adapting the base model with just 13.05 million trainable parameters in a 52 MB adapter that runs on consumer GPUs.",
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
      "BLEU 13.85 on the held-out English↔Luganda test split, up from 0.06 on the base model",
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
    tagline: "A Gemma 3 1B model adapted using LoRA for English to Swahili translation",
    overview:
      "Built on Google's Gemma 3 1B architecture, this model uses LoRA fine-tuning to improve English-to-Swahili translation. It was trained on more than 159,000 examples from MAFAND-MT, Sunbird SALT, Rogendo, Inkuba-Swahili-MMT, Aya, and Alpaca-Swahili, adapting the base model with just 26.09 million trainable parameters merged into full weights.",
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
      "BLEU 28.86 on English to Swahili (FLORES-200 devtest), up from 0.41 on the base model",
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
    tagline: "An NLLB-200 1.3B model adapted using LoRA for English to Swahili translation",
    overview:
      "Built on Meta's NLLB-200 1.3B architecture, this model uses LoRA fine-tuning to improve English-to-Swahili translation. It was trained on more than 145,000 parallel sentence pairs from MAFAND-MT, Sunbird SALT, Rogendo, and Inkuba-Swahili-MMT, adapting the base model with just 23.6 million trainable parameters.",
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
      "Purpose-built NLLB-200 translation architecture",
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
    tagline: "An NLLB-200 600M model adapted using LoRA for English to Swahili translation",
    overview:
      "Built on Meta's NLLB-200 600M architecture, this model uses LoRA fine-tuning to improve English-to-Swahili translation. It was trained on the same corpus mix as Swahili-nllb-1.3B, drawn from MAFAND-MT, Sunbird SALT, Rogendo, and Inkuba-Swahili-MMT, adapting the base model with just 8.65 million trainable parameters for tighter hardware budgets.",
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
