import { describe, expect, it } from "vitest";
import {
  finalizePuzzle,
  generateBoard,
  longestPair,
  MAX_PAIR_LETTERS,
  type Rng,
} from "@/lib/puzzle-generator";
import { puzzleError } from "@/lib/puzzle-validation";
import { WORDS } from "@/lib/word-library";
import { EDGES, SLOTS } from "@/types/puzzle";

/** Deterministic RNG (mulberry32) so failures are reproducible. */
function seeded(seed: number): Rng {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clues = { top: "Kitchen", right: "Red things", bottom: "Garden", left: "Music" };

describe("generateBoard", () => {
  it("deals four cards with valid rotations and unique words", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const board = generateBoard(seeded(seed));
      expect(board.cards).toHaveLength(4);
      expect(board.rotations).toHaveLength(4);
      board.rotations.forEach((r) => expect([0, 1, 2, 3]).toContain(r));

      const words = board.cards.flatMap((card) => EDGES.map((edge) => card.words[edge]));
      expect(new Set(words).size).toBe(16);
      words.forEach((word) => expect(WORDS).toContain(word));
      board.cards.forEach((card) => expect(longestPair(card.words)).toBeLessThanOrEqual(MAX_PAIR_LETTERS));
    }
  });
});

describe("finalizePuzzle", () => {
  it("adds one decoy and keeps the original arrangement as the solution", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = seeded(seed);
      const board = generateBoard(rng);
      const puzzle = finalizePuzzle(board, clues, rng);

      expect(puzzleError(puzzle)).toBeNull();
      expect(puzzle.cards).toHaveLength(5);
      puzzle.cards.forEach((card) => expect(Object.keys(card.words)).toHaveLength(4));

      const words = puzzle.cards.flatMap((card) => EDGES.map((edge) => card.words[edge]));
      expect(new Set(words).size).toBe(20);

      const solutionIds = SLOTS.map((slot) => puzzle.solution[slot].cardId);
      expect(new Set(solutionIds).size).toBe(4);
      const decoys = puzzle.cards.filter((card) => !solutionIds.includes(card.id));
      expect(decoys).toHaveLength(1);

      SLOTS.forEach((slot, index) => {
        const placement = puzzle.solution[slot];
        const card = puzzle.cards.find((c) => c.id === placement.cardId)!;
        expect(card.words).toEqual(board.cards[index].words);
        expect(placement.rotation).toBe(board.rotations[index]);
      });
    }
  });

  it("normalizes clue whitespace", () => {
    const puzzle = finalizePuzzle(generateBoard(seeded(3)), { ...clues, top: "  Things   in a  kitchen " }, seeded(4));
    expect(puzzle.clues.top).toBe("Things in a kitchen");
  });

  it("shuffles the tray order", () => {
    const decoyPositions = new Set<number>();
    for (let seed = 1; seed <= 50; seed++) {
      const rng = seeded(seed);
      const puzzle = finalizePuzzle(generateBoard(rng), clues, rng);
      const solutionIds = SLOTS.map((slot) => puzzle.solution[slot].cardId);
      decoyPositions.add(puzzle.cards.findIndex((card) => !solutionIds.includes(card.id)));
    }
    expect(decoyPositions.size).toBe(5);
  });
});
