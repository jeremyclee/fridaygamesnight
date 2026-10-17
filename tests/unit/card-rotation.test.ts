import { describe, expect, it } from "vitest";
import {
  clueWords,
  outerEdges,
  rotateClockwise,
  rotateWords,
  wordOnEdge,
} from "@/lib/card-rotation";
import type { CardWords, Rotation } from "@/types/puzzle";

const card: CardWords = { top: "APPLE", right: "PLATE", bottom: "FORK", left: "RIVER" };

describe("rotateWords", () => {
  it("leaves the card unchanged at rotation 0", () => {
    expect(rotateWords(card, 0)).toEqual(card);
  });

  it("moves each word one edge clockwise per quarter turn", () => {
    expect(rotateWords(card, 1)).toEqual({ top: "RIVER", right: "APPLE", bottom: "PLATE", left: "FORK" });
    expect(rotateWords(card, 2)).toEqual({ top: "FORK", right: "RIVER", bottom: "APPLE", left: "PLATE" });
    expect(rotateWords(card, 3)).toEqual({ top: "PLATE", right: "FORK", bottom: "RIVER", left: "APPLE" });
  });

  it("returns to the original after four clockwise turns", () => {
    let rotation: Rotation = 0;
    let words = card;
    for (let i = 0; i < 4; i++) {
      rotation = rotateClockwise(rotation);
      words = rotateWords(card, rotation);
    }
    expect(rotation).toBe(0);
    expect(words).toEqual(card);
  });

  it("agrees with wordOnEdge", () => {
    for (const rotation of [0, 1, 2, 3] as Rotation[]) {
      const rotated = rotateWords(card, rotation);
      for (const edge of ["top", "right", "bottom", "left"] as const) {
        expect(wordOnEdge(card, rotation, edge)).toBe(rotated[edge]);
      }
    }
  });
});

describe("clue relationships", () => {
  const w = (prefix: string): CardWords => ({
    top: `${prefix}T`,
    right: `${prefix}R`,
    bottom: `${prefix}B`,
    left: `${prefix}L`,
  });
  const placed = [w("TL"), w("TR"), w("BL"), w("BR")];

  it("pairs the outward-facing words of adjacent cards", () => {
    expect(clueWords(placed, "top")).toEqual(["TLT", "TRT"]);
    expect(clueWords(placed, "right")).toEqual(["TRR", "BRR"]);
    expect(clueWords(placed, "bottom")).toEqual(["BLB", "BRB"]);
    expect(clueWords(placed, "left")).toEqual(["TLL", "BLL"]);
  });

  it("uses rotated words", () => {
    const rotated = [rotateWords(w("TL"), 1), w("TR"), w("BL"), w("BR")];
    expect(clueWords(rotated, "top")).toEqual(["TLL", "TRT"]);
    expect(clueWords(rotated, "left")).toEqual(["TLB", "BLL"]);
  });

  it("returns null for empty slots", () => {
    expect(clueWords([null, w("TR"), null, null], "top")).toEqual([null, "TRT"]);
  });

  it("knows which edges of each slot face a clue", () => {
    expect(outerEdges("topLeft")).toEqual(["top", "left"]);
    expect(outerEdges("bottomRight")).toEqual(["right", "bottom"]);
  });
});
