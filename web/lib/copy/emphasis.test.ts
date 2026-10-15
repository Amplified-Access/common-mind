import { describe, expect, it } from "vitest";

import { splitEmphasis } from "./emphasis";

describe("splitEmphasis: *starred* words are highlighted", () => {
  it.each([
    ["plain text", "Open models", [{ text: "Open models", em: false }]],
    [
      "a starred phrase",
      "Civic discourse is *multilingual*.",
      [
        { text: "Civic discourse is ", em: false },
        { text: "multilingual", em: true },
        { text: ".", em: false },
      ],
    ],
    [
      "two starred phrases",
      "*AI* should be *too*",
      [
        { text: "AI", em: true },
        { text: " should be ", em: false },
        { text: "too", em: true },
      ],
    ],
    ["a lone star stays literal", "5 * 3", [{ text: "5 * 3", em: false }]],
  ])("%s", (_, input, expected) => {
    expect(splitEmphasis(input)).toEqual(expected);
  });
});
