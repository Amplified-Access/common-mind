import { describe, expect, it } from "vitest";

import { acceptanceRate, adminHref, readView } from "./view";

describe("readView", () => {
  it("reads the language, status and page from the address", () => {
    expect(readView({ language: "sw", status: "verified", page: "3" })).toEqual({
      language: "sw",
      status: "verified",
      page: 3,
    });
  });

  it("ignores an unknown status and a page that isn't a positive whole number", () => {
    for (const page of ["0", "-2", "two", "1.5", undefined]) {
      expect(readView({ status: "approved", page })).toEqual({ language: null, status: null, page: 1 });
    }
  });

  it("takes the first value when a parameter repeats", () => {
    expect(readView({ language: ["luo", "sw"] }).language).toBe("luo");
  });
});

describe("acceptanceRate", () => {
  it("is the share of reviewed work that was verified, as a whole percent", () => {
    expect(acceptanceRate({ verified: 2, rejected: 1 })).toBe(67);
  });

  it("is null before anything has been reviewed", () => {
    expect(acceptanceRate({ verified: 0, rejected: 0 })).toBeNull();
  });
});

describe("adminHref", () => {
  it("keeps only the parameters that change the view", () => {
    expect(adminHref("/data-lab/admin", { language: "sw", status: null, page: 1 })).toBe("/data-lab/admin?language=sw");
    expect(adminHref("/data-lab/admin", { language: null, status: "pending", page: 2 })).toBe(
      "/data-lab/admin?status=pending&page=2",
    );
    expect(adminHref("/data-lab/admin", { language: null, status: null, page: 1 })).toBe("/data-lab/admin");
  });
});
