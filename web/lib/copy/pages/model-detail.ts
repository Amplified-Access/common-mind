// Each model's page (/models/<slug>), original wording. {name} is the
// model's name, {pair} its language pair ("English to Swahili"), {languages}
// the languages it serves and {set} its evaluation set. The model's own
// copy (tagline, overview) is edited under Models.
export const modelDetail = {
  hero: { eyebrow: "Model" },
  tabs: {
    overview: "Overview",
    benchmarks: "Benchmarks",
    training: "Training",
    usage: "Usage",
    versions: "Versions",
  },
  overview: {
    eyebrow: "About this model",
    title: "Advancing {pair} translation",
    hfLink: "Hugging Face",
    tableTitle: "Model Information",
  },
  benchmarks: {
    eyebrow: "Performance",
    title: "Performance, measured openly",
    methodologyLink: "View full benchmark methodology",
    compareLink: "Compare with other models",
    panelTitle: "Performance",
    scale: "Scores out of 100 · {set}",
  },
  training: {
    title: "How the model was built",
    datasetLink: "View Dataset",
    notesLink: "Read Training Notes",
    researchLink: "View Research",
  },
  usage: {
    title: "Build with {name}",
    lede: "Integrate the model into your applications using the deployment option that best suits your needs.",
  },
  versions: {
    title: "Model history",
    current: "Current",
    initialRelease: "Initial Public Release",
    view: "View",
  },
  playground: {
    eyebrow: "Playground",
    title: "Try the Model",
    ledeBothWays: "Explore how the model translates civic discourse between English and {languages}",
    ledeOneWay: "Explore how the model translates civic discourse from English to {languages}",
  },
};
