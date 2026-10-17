import { describe, expect, it } from "vitest";
import { decodePuzzle, encodePuzzle } from "@/lib/puzzle-code";
import { finalizePuzzle, generateBoard } from "@/lib/puzzle-generator";
import { puzzleIds } from "@/lib/puzzle-id";
import type { Puzzle } from "@/types/puzzle";

const typicalClues = {
  top: "Things you find in a kitchen",
  right: "Things that are red",
  bottom: "Things you find in a garden",
  left: "Types of music",
};

function makePuzzle(clues = typicalClues): Puzzle {
  return finalizePuzzle(generateBoard(), clues);
}

describe("puzzle codes", () => {
  it("round-trips a puzzle exactly", () => {
    for (let i = 0; i < 100; i++) {
      const puzzle = makePuzzle();
      expect(decodePuzzle(encodePuzzle(puzzle))).toEqual(puzzle);
    }
  });

  it("produces URL-safe codes of a reasonable length", () => {
    const code = encodePuzzle(makePuzzle());
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    // 31 fixed bytes + 4 length bytes + 88 bytes of clue text = 123 bytes.
    expect(code.length).toBe(164);

    const longest = encodePuzzle(
      makePuzzle({ top: "x".repeat(60), right: "y".repeat(60), bottom: "z".repeat(60), left: "w".repeat(60) }),
    );
    expect(longest.length).toBeLessThan(400);
  });

  it("supports non-ASCII clues", () => {
    const puzzle = makePuzzle({ top: "Café 🍕", right: "Größe", bottom: "日本", left: "Ñandú" });
    expect(decodePuzzle(encodePuzzle(puzzle))?.clues).toEqual(puzzle.clues);
  });

  it("rejects malformed codes", () => {
    const code = encodePuzzle(makePuzzle());
    expect(decodePuzzle("")).toBeNull();
    expect(decodePuzzle("not a code!")).toBeNull();
    expect(decodePuzzle("AAAA")).toBeNull();
    expect(decodePuzzle(code.slice(0, -3))).toBeNull();
    expect(decodePuzzle(code + "AAAA")).toBeNull();
    expect(decodePuzzle("B" + code.slice(1))).toBeNull(); // wrong version
    expect(decodePuzzle("A".repeat(3000))).toBeNull();
  });

  it("never throws on random input", () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    for (let i = 0; i < 2000; i++) {
      const length = Math.floor(Math.random() * 200);
      let text = "AQ";
      for (let j = 0; j < length; j++) text += alphabet[Math.floor(Math.random() * alphabet.length)];
      expect(() => decodePuzzle(text)).not.toThrow();
    }
  });

  it("refuses to encode an invalid puzzle", () => {
    const puzzle = makePuzzle();
    expect(() => encodePuzzle({ ...puzzle, clues: { ...puzzle.clues, top: "  " } })).toThrow();
    expect(() => encodePuzzle({ ...puzzle, cards: puzzle.cards.slice(0, 4) })).toThrow();
    expect(() =>
      encodePuzzle({
        ...puzzle,
        solution: { ...puzzle.solution, topRight: puzzle.solution.topLeft },
      }),
    ).toThrow();
  });
});

describe("puzzleIds", () => {
  it("is stable and readable", () => {
    const code = encodePuzzle(makePuzzle());
    expect(puzzleIds(code)).toEqual(puzzleIds(code));
    expect(puzzleIds(code).label).toMatch(/^[2-9A-HJKMNP-TV-Z]{4}$/);
  });

  it("differs between puzzles", () => {
    const keys = new Set(Array.from({ length: 200 }, () => puzzleIds(encodePuzzle(makePuzzle())).key));
    expect(keys.size).toBe(200);
  });
});
