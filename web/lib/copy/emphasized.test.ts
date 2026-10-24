import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { Emphasized } from "./emphasized";

describe("Emphasized", () => {
  // Phones hide the break, so the words either side still need a space.
  it("keeps a space where a line break is hidden on phones", () => {
    const html = renderToStaticMarkup(createElement(Emphasized, { text: "Open models\nfor civic AI" }));
    expect(html.replace(/<br[^>]*>/g, "")).toBe("Open models for civic AI");
  });
});
