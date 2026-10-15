import { describe, expect, it } from "vitest";

import { fill } from "./fill";

describe("fill: {placeholders} take the page's values", () => {
  it.each([
    ["one value", "Datasets for {name}", { name: "Luganda" }, "Datasets for Luganda"],
    ["the same value twice", "{name}, {name}", { name: "Luo" }, "Luo, Luo"],
    ["an unknown placeholder stays as written", "Build {thing}", { name: "Luo" }, "Build {thing}"],
    ["no placeholders", "Open models", { name: "Luo" }, "Open models"],
  ])("%s", (_, text, values, expected) => {
    expect(fill(text, values)).toBe(expected);
  });
});
