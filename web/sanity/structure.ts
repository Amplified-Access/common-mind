import { CogIcon } from "@sanity/icons/Cog";
import { CubeIcon } from "@sanity/icons/Cube";
import { DocumentIcon } from "@sanity/icons/Document";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";
import { DocumentsIcon } from "@sanity/icons/Documents";
import type { StructureResolver } from "sanity/structure";

import { registryModels } from "../components/models/registry";
import { PAGES, pageDocumentId, pageTypeName, type PageKey } from "../lib/copy/pages";

import { PAGE_TYPES } from "./pageCopy";

// The Studio's sidebar. Fixed documents (each page's words, the footer, site settings,
// the legal pages, one copy document per registry model) open straight from
// the sidebar and are never created or deleted by editors; their IDs are
// what the site reads.

export const LEGAL_PAGES = [
  { id: "legal-privacy", title: "Privacy Policy" },
  { id: "legal-terms", title: "Terms of Use" },
];

/** Document types that only exist as the fixed documents above. */
export const FIXED_TYPES = new Set(["siteSettings", "footer", "legalPage", "model", ...PAGE_TYPES]);

export const modelDocumentId = (slug: string) => `model-${slug}`;

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Pages")
        .icon(DocumentIcon)
        .child(
          S.list()
            .title("Pages")
            .items([
              ...(Object.keys(PAGES) as PageKey[]).map((key) =>
                S.listItem()
                  .title(PAGES[key].title)
                  .id(pageDocumentId(key))
                  .icon(DocumentIcon)
                  .child(
                    S.document()
                      .schemaType(pageTypeName(key))
                      .documentId(pageDocumentId(key))
                      .title(PAGES[key].title),
                  ),
              ),
              S.listItem()
                .title("Footer")
                .id("footer")
                .icon(DocumentIcon)
                .child(S.document().schemaType("footer").documentId("footer").title("Footer")),
            ]),
        ),
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
