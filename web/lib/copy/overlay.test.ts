import { describe, expect, it } from "vitest";

import { overlay } from "./overlay";

const defaults = {
  title: "Open models",
  tags: ["Open", "Civic"],
  hero: { lede: "Built in the open.", cta: "Explore" },
};

describe("overlay: an editor's text over the page's original wording", () => {
  it.each([
    ["no document yet", null, defaults],
    ["a published edit", { title: "Small models" }, { ...defaults, title: "Small models" }],
    ["an emptied field", { title: "" }, defaults],
    ["a field of spaces", { title: "   " }, defaults],
    ["a value of the wrong kind", { title: 42, tags: "Open" }, defaults],
    [
      "a nested edit",
      { hero: { cta: "Browse" } },
      { ...defaults, hero: { lede: "Built in the open.", cta: "Browse" } },
    ],
    ["a list of tags", { tags: ["Small", ""] }, { ...defaults, tags: ["Small"] }],
    ["an emptied list", { tags: ["", " "] }, defaults],
    ["a field the page no longer has", { retired: "Old text" }, defaults],
  ])("%s", (_, edits, expected) => {
    expect(overlay(defaults, edits)).toEqual(expected);
  });
});
