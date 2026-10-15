// The Benchmarks page's original wording.
export const benchmarks = {
  meta: {
    title: "Benchmarks",
    description: "Reliable evaluation for civic AI. CivicBench Africa and published results.",
  },
  hero: {
    eyebrow: "Benchmarks",
    title: "Measure what improves.",
    lede: "Open reproducible benchmarks for evaluating multilingual AI performance across languages, civic discourse tasks, and community contexts.",
    tags: ["MULTILINGUAL", "OPEN EVALUATION", "CIVIC AI"],
  },
  results: {
    title: "Compare Model Performance.",
    lede: "Explore and compare model performance across languages, tasks, and evaluation metrics, with transparent results and references to public sources.",
  },
  compare: {
    title: "Compare Models",
    badge: "Sample data",
    lede: "Compare selected models across evaluation tasks and metrics. Translation results reflect measured chrF++ scores, while other tasks use illustrative values pending publication of CivicBench Africa results.",
  },
  civicBench: {
    eyebrow: "CivicBench Africa",
    title: "Nine dimensions of civic understanding",
    lede: "Civic bench Africa establishes a framework for evaluating how AI models interprete, process, and respond to civic discourse across languages and community contexts.",
    resultsLink: "Results",
    inDevelopment: "In development",
  },
  adaptation: {
    eyebrow: "Adaptation",
    title: "One foundation. Different language capabilities.",
    lede: "Compare Gemma 3 1B before and after language-specific adaptation for multilingual civic AI.",
  },
  efficiency: {
    eyebrow: "Efficiency",
    title: "Smaller models. Measurable gains.",
    lede: "A 615M-parameter model outperforms Gemma 3 27B on English-to-Swahili translation, demonstrating that model size alone does not determine performance.",
  },
  methodology: {
    eyebrow: "Methodology",
    title: "How we measure.",
    metricsTitle: "Evaluation Metrics",
    metrics:
      "BLEU measures n-gram overlap with reference translations, while chrF++ captures character- and word-level similarity, providing additional sensitivity to morphological variation.",
    standardisedTitle: "Standardised Evaluation",
    standardised:
      "Models are compared using shared evaluation sets. Swahili models are evaluated on FLORES-200, while Luganda models use a held-out test set.",
    reproducibleTitle: "Reproducible Results",
    reproducible:
      "Evaluation methods, datasets, and model configurations are documented to support transparent, consistent, and reproducible comparisons.",
  },
  playground: {
    eyebrow: "Playground",
    title: "Explore the models in action.",
    lede: "Test how models translate civic discourse between English, Luganda, and Swahili.",
  },
};
