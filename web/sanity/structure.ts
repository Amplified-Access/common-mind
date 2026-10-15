import {
  CogIcon,
  CubeIcon,
  DocumentsIcon,
  DocumentTextIcon,
} from "@sanity/icons";
import type { StructureResolver } from "sanity/structure";

import { registryModels } from "../components/models/registry";

// The Studio's sidebar. Fixed documents (site settings, the legal pages, one
// copy document per registry model) open straight from the sidebar and are
// never created or deleted by editors; their IDs are what the site reads.

export const LEGAL_PAGES = [
  { id: "legal-privacy", title: "Privacy Policy" },
  { id: "legal-terms", title: "Terms of Use" },
];

/** Document types that only exist as the fixed documents above. */
export const FIXED_TYPES = new Set(["siteSettings", "legalPage", "model"]);

export const modelDocumentId = (slug: string) => `model-${slug}`;

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Research")
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title("Research")
            .items([
              S.documentTypeListItem("publication").title("Research reports"),
              S.documentTypeListItem("release").title("Model releases"),
            ]),
        ),
      S.listItem()
        .title("Models")
        .icon(CubeIcon)
        .child(
          S.list()
            .title("Models")
            .items(
              registryModels.map(({ slug, name }) =>
                S.listItem()
                  .title(name)
                  .id(modelDocumentId(slug))
                  .icon(CubeIcon)
                  .child(
                    S.document()
                      .schemaType("model")
                      .documentId(modelDocumentId(slug))
                      .initialValueTemplate("model-for-slug", { slug })
                      .title(name),
                  ),
              ),
            ),
        ),
      S.documentTypeListItem("dataset").title("Datasets"),
      S.documentTypeListItem("application").title("Applications"),
      S.divider(),
      S.listItem()
        .title("Legal pages")
        .icon(DocumentsIcon)
        .child(
          S.list()
            .title("Legal pages")
            .items(
              LEGAL_PAGES.map(({ id, title }) =>
                S.listItem()
                  .title(title)
                  .id(id)
                  .icon(DocumentsIcon)
                  .child(S.document().schemaType("legalPage").documentId(id).title(title)),
              ),
            ),
        ),
      S.listItem()
        .title("Site settings")
        .id("siteSettings")
        .icon(CogIcon)
        .child(S.document().schemaType("siteSettings").documentId("siteSettings").title("Site settings")),
    ]);
