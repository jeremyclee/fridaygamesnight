import { describe, expect, it } from "vitest";
import { isPuzzleId, newPuzzleId, PUZZLE_ID_LENGTH, puzzleLabel } from "@/games/clover/lib/puzzle-id";

describe("puzzle ids", () => {
  it("are short, URL-safe and random", () => {
    const ids = Array.from({ length: 2000 }, newPuzzleId);
    for (const id of ids) {
      expect(id).toHaveLength(PUZZLE_ID_LENGTH);
      expect(id).toMatch(/^[0-9A-Za-z]+$/);
      expect(isPuzzleId(id)).toBe(true);
    }
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("use every character", () => {
    const seen = new Set(Array.from({ length: 500 }, newPuzzleId).join(""));
    expect(seen.size).toBe(62);
  });

  it("rejects malformed ids", () => {
    for (const id of ["", "short", "waytoolong12345", "has-dash-x", "../../etc1", "ABCDEFGHI!"]) {
      expect(isPuzzleId(id)).toBe(false);
    }
  });
});

describe("puzzleLabel", () => {
  it("is stable and easy to read", () => {
    const id = newPuzzleId();
    expect(puzzleLabel(id)).toBe(puzzleLabel(id));
    expect(puzzleLabel(id)).toMatch(/^[2-9A-HJKMNP-TV-Z]{4}$/);
  });
});
