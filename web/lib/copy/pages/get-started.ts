// The Get Started page's original wording: a map of the site's resources.
// Where each card leads is set in app/(site)/get-started/page.tsx.
export const getStarted = {
  meta: {
    title: "Get Started",
    description: "Models, datasets, benchmarks, and guides for building with CommonMind.",
  },
  hero: {
    eyebrow: "Get Started",
    title: "Start building with\n*CommonMind.*",
    lede: "Access language models, explore datasets, and build AI experiences that understand more voices.",
    primaryCta: "Read the Quickstart",
  },
  nav: {
    overview: "Overview",
    tasks: "What to build",
    quickstarts: "Quickstarts",
  },
  overview: {
    eyebrow: "Overview",
    title: "Getting started",
    lede: "Everything you need to explore and build with CommonMind.",
    models: {
      title: "Explore Models",
      text: "Find language models designed for different tasks, languages, and applications.",
      cta: "Browse Models",
    },
    datasets: {
      title: "Discover Datasets",
      text: "Access language resources that support training, evaluation, and research.",
      cta: "Explore Datasets",
    },
    build: {
      title: "Developer Documentation",
      text: "Follow practical guides to understand and integrate supported models and tools.",
      cta: "Read the Docs",
    },
    dataLab: {
      title: "Turn language data into meaningful impact.",
      text: "The CommonMind Data Lab is a collaborative space for building, improving, and evaluating the language datasets that power more inclusive AI.",
      cta: "Explore Data Lab",
    },
  },
  tasks: {
    eyebrow: "Applications",
    title: "What would you like to build?",
    lede: "Explore common language AI applications and find resources to get started.",
    cta: "Get Started",
    translation: {
      title: "Machine Translation",
      text: "Translate between English and languages beyond the mainstream.",
    },
    languages: {
      title: "Language Ecosystems",
      text: "Find the models, datasets, and benchmarks behind each language.",
    },
    terminology: {
      title: "Civic Terminology",
      text: "Map how a community says it to what it means, language by language.",
    },
    classification: {
      title: "Issue Classification",
      text: "Route each civic report to the right place.",
    },
    evaluation: {
      title: "Language Evaluation",
      text: "Measure and compare model performance on open benchmarks.",
    },
    community: {
      title: "Community Data",
      text: "Contribute language resources and review the work of other volunteers.",
    },
  },
  quickstarts: {
    eyebrow: "Guides",
    title: "Developer quickstarts",
    lede: "Practical guides to help you move from exploration to implementation.",
    python: {
      title: "Getting started with Python",
      text: "Load a model with Transformers and PEFT and run translation locally.",
    },
    api: {
      title: "Calling the translation API",
      text: "Send text, a model, and a direction; get the translation back as JSON.",
    },
    modelCards: {
      title: "Understanding model documentation",
      text: "Read a model's capabilities, requirements, and limitations from its model card.",
    },
    datasets: {
      title: "Working with datasets",
      text: "Understand dataset formats, licensing, and responsible usage.",
    },
    benchmarks: {
      title: "Evaluating model performance",
      text: "Read benchmark results and compare models with the methodology behind them.",
    },
  },
};
