import { describe, expect, it } from "vitest";

import { ASL, type SignLanguage } from "./languages";
import { LEXICON } from "./lexicon";
import { planSigns } from "./plan";

const glosses = (text: string) => planSigns(text).items.map((i) => i.gloss);

describe("planSigns", () => {
  it("signs a known word and its other words", () => {
    expect(glosses("hello")).toEqual(["HELLO"]);
    expect(glosses("Hi!")).toEqual(["HELLO"]);
  });

  it("matches a phrase as one sign", () => {
    expect(glosses("Thank you")).toEqual(["THANK-YOU"]);
    expect(glosses("I love you")).toEqual(["I-LOVE-YOU"]);
  });

  it("signs everyday words and phrases that share a known sign", () => {
    expect(glosses("You're welcome")).toEqual(["WELCOME"]);
    expect(glosses("I would like water")).toEqual(["ME", "WANT", "WATER"]);
    expect(glosses("We have to go")).toEqual(["WE", "NEED", "GO"]);
    expect(glosses("My daddy came")).toEqual(["MY", "FATHER", "COME"]);
    expect(glosses("thank u, pls help")).toEqual(["THANK-YOU", "PLEASE", "HELP"]);
    expect(glosses("this is alright")).toEqual(["IX", "FINE"]);
  });

  it("drops the words ASL leaves out", () => {
    expect(glosses("The water is good")).toEqual(["WATER", "GOOD"]);
  });

  it("fingerspells a word it has no sign for", () => {
    const [item] = planSigns("Grace").items;
    expect(item).toMatchObject({ kind: "spell", gloss: "fs-GRACE", chars: ["G", "R", "A", "C", "E"] });
  });

  it("spells letters with accents as their base letters", () => {
    expect(glosses("café")).toEqual(["fs-CAFE"]);
  });

  it("spells numbers digit by digit", () => {
    const [, number] = planSigns("room 42").items;
    expect(number).toMatchObject({ kind: "spell", gloss: "#42", chars: ["4", "2"] });
  });

  it("opens contractions", () => {
    expect(glosses("I'm happy")).toEqual(["ME", "HAPPY"]);
    expect(glosses("I don't understand")).toEqual(["ME", "NOT", "UNDERSTAND"]);
    expect(glosses("We can't go")).toEqual(["WE", "CAN", "NOT", "GO"]);
  });

  it("finds the sign for plurals and verb endings", () => {
    expect(glosses("friends")).toEqual(["FRIEND"]);
    expect(glosses("learning")).toEqual(["LEARN"]);
    expect(glosses("helped")).toEqual(["HELP"]);
  });

  it("moves the question word to the end of a wh-question", () => {
    const plan = planSigns("What is your name?");
    expect(plan.mood).toBe("wh-question");
    expect(plan.items.map((i) => i.gloss)).toEqual(["YOUR", "NAME", "WHAT"]);
  });

  it("marks a yes/no question", () => {
    const plan = planSigns("Are you deaf?");
    expect(plan.mood).toBe("yn-question");
    expect(plan.items.map((i) => i.gloss)).toEqual(["YOU", "DEAF"]);
  });

  it("treats a statement as a statement", () => {
    expect(planSigns("I am deaf.").mood).toBe("statement");
  });

  it("keeps the words each item came from", () => {
    expect(planSigns("thank you friends").items.map((i) => i.word)).toEqual(["thank you", "friends"]);
  });

  it("marks a pause after each phrase and sentence", () => {
    const pauses = planSigns("Hello, my name is Grace. Thank you!").items.map((i) => [i.gloss, i.pause]);
    expect(pauses).toEqual([
      ["HELLO", "phrase"],
      ["MY", undefined],
      ["NAME", undefined],
      ["fs-GRACE", "sentence"],
      ["THANK-YOU", "sentence"],
    ]);
  });

  it("reads a decimal point as part of the number", () => {
    expect(planSigns("pay 3.5 now").items.slice(0, -1).some((i) => i.pause)).toBe(false);
  });

  it("moves the question word to the end of its own sentence", () => {
    expect(glosses("Hello. What is your name?")).toEqual(["HELLO", "YOUR", "NAME", "WHAT"]);
    expect(glosses("What is your name? I am deaf.")).toEqual(["YOUR", "NAME", "WHAT", "ME", "DEAF"]);
  });

  it("plans nothing for empty or wordless text", () => {
    expect(planSigns("").items).toEqual([]);
    expect(planSigns("  ?! ").items).toEqual([]);
  });

  describe("in another sign language", () => {
    const other: SignLanguage = {
      id: "xxx",
      abbr: "XSL",
      name: "Test Sign Language",
      lexicon: [{ gloss: "FRIEND-X", words: ["friend"], frames: [{ r: { shape: "B" } }] }],
      alphabet: { A: { shape: "A" }, B: { shape: "B" } },
      finalWh: new Set(),
    };
    const plan = (text: string) => planSigns(text, other).items;

    it("signs with that language's signs", () => {
      expect(plan("friend").map((i) => i.gloss)).toEqual(["FRIEND-X"]);
    });

    it("spells with that language's alphabet, leaving out letters it has none for", () => {
      expect(plan("hello")).toEqual([]);
      const [spelled] = plan("abc");
      expect(spelled.kind === "spell" && spelled.chars).toEqual(["A", "B"]);
    });

    it("moves the question sign to the end only where the language does", () => {
      const what = LEXICON.find((s) => s.gloss === "WHAT")!;
      const lexicon = [...other.lexicon, what];
      const glossesIn = (finalWh: Set<string>) =>
        planSigns("What friend?", { ...other, lexicon, finalWh }).items.map((i) => i.gloss);
      expect(glossesIn(new Set())).toEqual(["WHAT", "FRIEND-X"]);
      expect(glossesIn(new Set(["WHAT"]))).toEqual(["FRIEND-X", "WHAT"]);
    });

    it("borrows a sign from another language for a word it has none for, and says so", () => {
      const items = planSigns("friend thank you", { ...other, borrowsFrom: ASL }).items;
      expect(items.map((i) => [i.gloss, i.kind === "sign" ? i.borrowed : undefined])).toEqual([
        ["FRIEND-X", undefined],
        ["THANK-YOU", "ASL"],
      ]);
    });

    it("carries the language for the timeline to spell with", () => {
      expect(planSigns("abc", other).language).toBe(other);
    });
  });
});
