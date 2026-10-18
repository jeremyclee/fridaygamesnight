import { describe, expect, it } from "vitest";
import { finalizePuzzle, generateBoard } from "@/games/clover/lib/puzzle-generator";
import { parseCheckRequest, parseCreatePuzzleRequest, parseStoredPuzzle } from "@/games/clover/lib/schemas";

const clues = { top: "Breakfast", right: "Outdoors", bottom: "Sparkly", left: "Loud" };

describe("parseCreatePuzzleRequest", () => {
  it("accepts a generated board with clues", () => {
    const board = generateBoard();
    expect(parseCreatePuzzleRequest({ board, clues })).toEqual({ ok: true, value: { board, clues } });
  });

  it("rejects malformed requests", () => {
    const board = generateBoard();
    const bad: unknown[] = [
      null,
      "puzzle",
      { clues },
      { board: { ...board, cards: board.cards.slice(0, 3) }, clues },
      { board: { ...board, rotations: [0, 1, 2, 4] }, clues },
      { board, clues: { ...clues, left: undefined } },
    ];
    for (const body of bad) expect(parseCreatePuzzleRequest(body).ok).toBe(false);
  });

  it("enforces clue rules", () => {
    const board = generateBoard();
    expect(parseCreatePuzzleRequest({ board, clues: { ...clues, top: "   " } })).toMatchObject({ ok: false });
    expect(parseCreatePuzzleRequest({ board, clues: { ...clues, top: "x".repeat(61) } })).toMatchObject({ ok: false });
    expect(parseCreatePuzzleRequest({ board, clues: { ...clues, top: "😀".repeat(60) } }).ok).toBe(true);
  });

  it("only allows built-in, unique words", () => {
    const board = generateBoard();
    const custom = structuredClone(board);
    custom.cards[0].words.top = "HELLO123";
    expect(parseCreatePuzzleRequest({ board: custom, clues })).toMatchObject({ ok: false });

    const duplicate = structuredClone(board);
    duplicate.cards[1].words.top = duplicate.cards[0].words.top;
    expect(parseCreatePuzzleRequest({ board: duplicate, clues })).toMatchObject({ ok: false });
  });
});

describe("parseStoredPuzzle", () => {
  it("round-trips a finished puzzle and ignores extra fields", () => {
    const puzzle = finalizePuzzle(generateBoard(), clues);
    expect(parseStoredPuzzle({ ...puzzle, schemaVersion: 1, createdAt: new Date() })).toEqual(puzzle);
  });

  it("rejects damaged documents", () => {
    const puzzle = finalizePuzzle(generateBoard(), clues);
    expect(parseStoredPuzzle({ ...puzzle, cards: puzzle.cards.slice(1) })).toBeNull();
    expect(parseStoredPuzzle({ clues: puzzle.clues })).toBeNull();
    expect(parseStoredPuzzle(null)).toBeNull();
  });
});

describe("parseCheckRequest", () => {
  it("accepts four slots, empty or placed", () => {
    const placements = [{ cardId: "c1", rotation: 0 }, null, { cardId: "c3", rotation: 3 }, null];
    expect(parseCheckRequest({ placements })).toEqual(placements);
  });

  it("rejects anything else", () => {
    for (const body of [null, {}, { placements: [null, null, null] }, { placements: [{ cardId: "c1", rotation: 4 }, null, null, null] }]) {
      expect(parseCheckRequest(body)).toBeNull();
    }
  });
});
