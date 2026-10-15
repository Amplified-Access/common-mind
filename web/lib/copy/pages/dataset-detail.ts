// Each dataset's page (/datasets/<slug>), original wording. {name} is the
// dataset's name, {kind} its kind and {models} the models built with it.
export const datasetDetail = {
  hero: { eyebrow: "Datasets / {kind}" },
  nav: {
    overview: "Overview",
    data: "Data",
    methodology: "Methodology",
    usage: "Usage",
    models: "Models",
    limitations: "Limitations",
    versions: "Versions",
  },
  overview: {
    eyebrow: "Overview",
    title: "The data, in context.",
    usedBy: "CommonMind uses it to train and evaluate {models}.",
    tableTitle: "DATASET INFORMATION",
  },
  data: {
    eyebrow: "Data",
    title: "Explore what's in the dataset.",
    lede: "Understand the language, content, and structure represented within the corpus.",
    previewTitle: "DATA PREVIEW",
    previewNote: "Sample rows will appear here once the preview is published.",
    representedTitle: "What's represented.",
    representedLede: "Understand the languages, data types, and contexts covered by this dataset.",
    domains: "Domains",
  },
  methodology: {
    eyebrow: "Methodology",
    title: "How the dataset was built.",
    lede: "Learn how the data was collected, processed, structured, reviewed, and prepared for civic language research.",
    collection: { title: "Collection", text: "How the source language data was gathered." },
    processing: {
      title: "Processing",
      text: "How speech and related resources were prepared and structured.",
    },
    annotation: {
      title: "Annotation",
      text: "How language and civic information were organised within the dataset.",
    },
    review: { title: "Review", text: "How the resulting data was assessed and prepared for use." },
  },
  usage: {
    eyebrow: "Usage",
    title: "Use {name}.",
    lede: "Access the dataset for research, model development, evaluation, and civic language experimentation.",
    documentationTab: "Documentation",
    documentationText: "The publisher's page documents the dataset's sources, structure and terms of use.",
    readDocumentation: "Read Documentation",
    detailsTitle: "Dataset Details",
    download: "Download Dataset",
  },
  models: {
    eyebrow: "Connected Models",
    title: "Models connected to this dataset.",
    lede: "Explore models and language tools built with {name}.",
    cardCta: "View Model",
  },
  limitations: {
    eyebrow: "Limitations",
    title: "Understand the boundaries of the data.",
    lede: "Review known limitations, representation gaps, intended uses, and areas where additional language data or research may be needed.",
    known: { title: "Known Limitations", text: "Document known gaps and constraints within the dataset." },
    intended: {
      title: "Intended Use",
      text: "Describe the research and development contexts the dataset is designed to support.",
    },
    outOfScope: {
      title: "Out-of-Scope Use",
      text: "Clarify applications or interpretations the dataset was not designed to support.",
    },
    representation: {
      title: "Representation",
      text: "Document relevant considerations around language and contextual coverage.",
    },
  },
  versions: {
    eyebrow: "Versions",
    title: "Dataset history.",
    lede: "Track changes, additions, and improvements across releases.",
    inUse: "In use",
    releaseNotes: "View Release Notes",
  },
};
