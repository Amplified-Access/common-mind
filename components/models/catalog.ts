import type { ModelCardData } from "./model-card";
import { registryModels, tasks, type RegistryModel, type TaskId } from "./registry";

// What the registry grid needs from each model, and nothing more: the
// grid is a client component, and the full records carry long code samples.
export type CatalogEntry = ModelCardData & {
  task: TaskId;
  languages: string[];
  license: string;
  availability: string[];
  release: string;
  bleu: number;
};

export const taskLabel = (id: TaskId) => tasks.find((t) => t.id === id)?.label ?? id;

// "Luganda", "Swahili": the language a model serves, without English.
export const servedLanguages = (model: RegistryModel) =>
  model.languageNames.filter((name) => name !== "English");

export function modelCardData(model: RegistryModel): ModelCardData {
  return {
    slug: model.slug,
    name: model.name,
    fields: [
      { label: "Base", value: `${model.base.params} ${model.architecture.split(" · ")[1]}` },
      { label: "Language", value: servedLanguages(model).join(", ") },
      { label: "License", value: model.license.split(" · ")[0] },
      { label: "Direction", value: model.directions.join(", ") },
      {
        label: "BLEU",
        value: `${model.evaluation.bleu.toFixed(2)}${model.evaluation.flores ? "" : " (held-out)"}`,
      },
      { label: "Trained", value: `${model.trainable} params` },
    ],
    tags: [...servedLanguages(model), taskLabel(model.task), "Open Model"],
  };
}

export const modelCatalog: CatalogEntry[] = registryModels.map((model) => ({
  ...modelCardData(model),
  task: model.task,
  languages: servedLanguages(model),
  license: model.license.split(" · ")[0],
  availability: model.availability.map((a) => a.label),
  release: model.release,
  bleu: model.evaluation.bleu,
}));
