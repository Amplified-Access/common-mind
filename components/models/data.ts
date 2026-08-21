type Metric = {
  value: string;
  label: string;
};

export type Model = {
  slug: string;
  name: string;
  tagline: string;
  platforms: string[];
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
];
