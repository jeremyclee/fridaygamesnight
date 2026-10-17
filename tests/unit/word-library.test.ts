import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { MAX_WORD_LENGTH, MIN_WORD_LENGTH, WORDS } from "@/lib/word-library";

/**
 * Share links store words by index. If this test fails, an existing word was
 * edited, removed or moved, which would silently change every published puzzle
 * that uses it. Revert the edit and append new words instead.
 */
const V1_COUNT = 1031;
const V1_SHA256 = "493caeaa4e225a3d0136f211a8fcca7a5d121c61041de654bed3e2fb5db8bace";

describe("word library", () => {
  it("never changes existing entries", () => {
    const original = WORDS.slice(0, V1_COUNT).join(" ");
    expect(createHash("sha256").update(original).digest("hex")).toBe(V1_SHA256);
  });

  it("fits in the 11-bit word index used by share links", () => {
    expect(WORDS.length).toBeLessThanOrEqual(2048);
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
