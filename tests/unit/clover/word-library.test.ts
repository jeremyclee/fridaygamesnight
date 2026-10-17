import { describe, expect, it } from "vitest";
import { MAX_WORD_LENGTH, MIN_WORD_LENGTH, WORDS } from "@/games/clover/lib/word-library";

describe("word library", () => {
  it("has enough words for many different boards", () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(500);
  });

  it("contains unique, short, uppercase words", () => {
    expect(new Set(WORDS).size).toBe(WORDS.length);
    for (const word of WORDS) {
      expect(word).toMatch(/^[A-Z]+$/);
      expect(word.length).toBeGreaterThanOrEqual(MIN_WORD_LENGTH);
      expect(word.length).toBeLessThanOrEqual(MAX_WORD_LENGTH);
    }
  });
});
