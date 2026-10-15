"use client";

import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";

import { SANITY_API_VERSION } from "./sanity/apiVersion";
import { dataset, projectId } from "./sanity/env";
import { schemaTypes } from "./sanity/schemaTypes";

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
  plugins: [structureTool(), visionTool({ defaultApiVersion: SANITY_API_VERSION })],
  schema: { types: schemaTypes },
});
