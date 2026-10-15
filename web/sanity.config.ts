"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { SANITY_API_VERSION } from "./sanity/apiVersion";
import { dataset, projectId } from "./sanity/env";
import { schemaTypes } from "./sanity/schemaTypes";
import { FIXED_TYPES, structure } from "./sanity/structure";

// The Studio, embedded in the site at /studio (app/studio): a client module
// ("use client") so the server page can hand it to NextStudio. The Sanity CLI
// reads this file too (schema validation), which is why it sits at the web
// root and imports relatively. See docs/cms.md.
export default defineConfig({
  name: "default",
  title: "CommonMind",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: SANITY_API_VERSION }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => [
      ...templates.filter(({ schemaType }) => !FIXED_TYPES.has(schemaType)),
      // A model's copy document, opened from its entry under Models.
      {
        id: "model-for-slug",
        title: "Model copy",
        schemaType: "model",
        parameters: [{ name: "slug", type: "string" }],
        value: (params: { slug: string }) => ({ slug: params.slug, usage: { language: "python" } }),
      },
    ],
  },
  document: {
    // Fixed documents can be published and reverted, never duplicated or
    // deleted.
    actions: (actions, { schemaType }) =>
      FIXED_TYPES.has(schemaType)
        ? actions.filter(
            ({ action }) => action && ["publish", "discardChanges", "restore"].includes(action),
          )
        : actions,
    newDocumentOptions: (prev) =>
      prev.filter((item) => item.templateId !== "model-for-slug" && !FIXED_TYPES.has(item.templateId)),
  },
});
