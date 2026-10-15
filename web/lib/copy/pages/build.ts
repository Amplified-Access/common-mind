// The Build page's original wording. The code samples are in
// components/build/snippets.ts; each step and path here names one by id.
export const build = {
  meta: {
    title: "Build",
    description: "Open models, APIs, and deployment options for civic applications.",
  },
  hero: {
    eyebrow: "Build",
    title: "Build with CommonMind.",
    lede: "From experimentation to production. Open models, APIs, and deployment tools for building multilingual AI applications grounded in civic discourse.",
    tags: ["OPEN MODELS", "APIs", "DEPLOYMENT"],
    primaryCta: "Get Started",
    secondaryCta: "Read the Docs",
  },
  quickstart: {
    eyebrow: "Quickstart",
    title: "From code to inference in minutes.",
    lede: "Load an open model with Transformers and PEFT to run English-to-Swahili translation locally.",
  },
  journey: {
    eyebrow: "Developer Journey",
    title: "Discover. Install. Run. Build. Deploy.",
    lede: "A clear path from exploring open models to integrating multilingual capabilities into real-world applications.",
    discover: {
      label: "Discover",
      text: "Explore available models, supported languages, capabilities, and evaluation results.",
    },
    install: {
      label: "Install",
      text: "Access model weights, adapters, and dependencies through familiar developer tools.",
    },
    run: { label: "Run", text: "Test model inference locally with your own inputs." },
    build: { label: "Build", text: "Integrate language capabilities into applications and workflows." },
    deploy: {
      label: "Deploy",
      text: "Run models in production using infrastructure suited to your application.",
    },
  },
  paths: {
    eyebrow: "Deployment",
    title: "Built for your infrastructure.",
    lede: "Integrate CommonMind models into existing development environments, from local experimentation to production systems.",
    python: { label: "Python", text: "Model inference using Transformers and PEFT." },
    huggingface: { label: "Hugging Face", text: "Open weights, adapters, and model documentation." },
    ollama: { label: "Ollama", text: "Local inference for compatible quantized models." },
    api: { label: "API", text: "Programmatic access through supported endpoints." },
    local: { label: "Local", text: "Deployment on personal machines or dedicated GPUs." },
    edge: {
      label: "Edge",
      text: "Lightweight inference for compatible models in resource-constrained environments.",
    },
  },
  api: {
    eyebrow: "API",
    title: "One interface. Multiple models.",
    lede: "Access multilingual translation through a consistent API, with simple requests for model selection, text input, and language direction.",
    modelSlug: "Identifier of the model to run",
    text: "Input text, up to 500 characters",
    direction: "Translation direction for supported models",
    cta: "Explore Model Cards",
  },
};
