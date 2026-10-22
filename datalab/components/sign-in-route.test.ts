import { describe, expect, it } from "vitest";

import { safeNext } from "./sign-in-route";

describe("safeNext", () => {
  it("keeps a path in this app", () => {
    expect(safeNext("/review/sw")).toBe("/review/sw");
    expect(safeNext("/contribute/yo?x=1")).toBe("/contribute/yo?x=1");
  });

  it("sends everything else to the workspace", () => {
    for (const next of [undefined, ["/review/sw"], "", "/", "/sign-in?next=/x", "//evil.example", "/\\evil.example", "https://evil.example"]) {
      expect(safeNext(next)).toBe("/workspace");
    }
  });
});
