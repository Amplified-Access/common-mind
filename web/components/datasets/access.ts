import type { Dataset } from "./data";

export type AccessSnippet = {
  id: "python" | "download" | "api";
  label: string;
  language: string;
  title: string;
  code: string;
};

// Where a dataset lives, read from its URL.
function locate(href: string) {
  const url = new URL(href);
  const path = url.pathname.replace(/^\/|\/$/g, "");
  if (url.hostname === "huggingface.co") {
    return { host: "huggingface" as const, id: path.replace(/^datasets\//, "") };
  }
  if (url.hostname.endsWith("kaggle.com")) {
    return { host: "kaggle" as const, id: path.replace(/^datasets\//, "") };
  }
  return { host: "github" as const, id: path };
}

// Ways to get at a dataset, generated from where it's published.
export function accessSnippets(dataset: Dataset): AccessSnippet[] {
  const { host, id } = locate(dataset.href);

  if (host === "huggingface") {
    return [
      {
        id: "python",
        label: "Python",
        language: "python",
        title: "load.py",
        code: `from datasets import load_dataset

# Datasets with several configurations take one as a second argument.
ds = load_dataset("${id}")
print(ds)`,
      },
      {
        id: "download",
        label: "Download",
        language: "bash",
        title: "terminal",
        code: `hf download ${id} --repo-type dataset`,
      },
      {
        id: "api",
        label: "API",
        language: "bash",
        title: "terminal",
        code: `# Dataset metadata from the Hugging Face Hub
curl -s https://huggingface.co/api/datasets/${id}`,
      },
    ];
  }

  if (host === "kaggle") {
    return [
      {
        id: "python",
        label: "Python",
        language: "python",
        title: "load.py",
        code: `import kagglehub

path = kagglehub.dataset_download("${id}")
print(path)`,
      },
      {
        id: "download",
        label: "Download",
        language: "bash",
        title: "terminal",
        code: `kaggle datasets download -d ${id} --unzip`,
      },
    ];
  }

  return [
    {
      id: "download",
      label: "Download",
      language: "bash",
      title: "terminal",
      code: `git clone https://github.com/${id}`,
    },
    {
      id: "api",
      label: "API",
      language: "bash",
      title: "terminal",
      code: `# Repository metadata from the GitHub API
curl -s https://api.github.com/repos/${id}`,
    },
  ];
}
