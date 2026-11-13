import { describe, expect, it } from "vitest";

import { visemesFor } from "./mouthing";

describe("visemesFor", () => {
  it("reads letter pairs as one sound", () => {
    expect(visemesFor("thank")).toEqual(["TH", "aa", "nn", "kk"]);
    expect(visemesFor("she")).toEqual(["CH", "I"]);
    expect(visemesFor("food")).toEqual(["FF", "U", "DD"]);
  });

  it("closes the lips for m, b and p", () => {
    expect(visemesFor("me")).toEqual(["PP", "I"]);
    expect(visemesFor("bye")[0]).toBe("PP");
  });

  it("leaves a final e silent and lengthens the vowel before it", () => {
    expect(visemesFor("name")).toEqual(["nn", "E", "PP"]);
    expect(visemesFor("grace")).toEqual(["kk", "RR", "E", "SS"]);
  });

  it("keeps a repeated sound once", () => {
    expect(visemesFor("hello")).toEqual(["E", "DD", "O"]);
  });

  it("reads a y before a vowel as a glide", () => {
    expect(visemesFor("you")).toEqual(["I", "U"]);
  });

  it("says digits as their number words", () => {
    expect(visemesFor("2")).toEqual(visemesFor("two"));
  });

  it("has nothing to mouth for an empty word", () => {
    expect(visemesFor("")).toEqual([]);
  });
});
