import { isRotation } from "@/lib/card-rotation";
import { EDGES, SLOTS, type Clues, type Puzzle } from "@/types/puzzle";

export const MAX_CLUE_LENGTH = 60;
export const CARD_COUNT = 5;

/** Count characters the way people do, so emoji count as one. */
export function clueLength(clue: string): number {
  return [...clue].length;
}

export function normalizeClue(clue: string): string {
  return clue.trim().replace(/\s+/g, " ");
}

export function clueError(clue: string): string | null {
  const normalized = normalizeClue(clue);
  if (!normalized) return "Write a clue";
  if (clueLength(normalized) > MAX_CLUE_LENGTH) return `Keep it under ${MAX_CLUE_LENGTH} characters`;
  return null;
}

export function areCluesComplete(clues: Clues): boolean {
  return EDGES.every((edge) => clueError(clues[edge]) === null);
}

/** Returns a description of the first problem found, or null if the puzzle is valid. */
export function puzzleError(puzzle: Puzzle): string | null {
  for (const edge of EDGES) {
    const clue = puzzle.clues[edge];
    if (typeof clue !== "string" || clueError(clue)) return `Invalid ${edge} clue`;
  }

  if (puzzle.cards.length !== CARD_COUNT) return `Expected ${CARD_COUNT} cards`;
  const ids = puzzle.cards.map((card) => card.id);
  if (new Set(ids).size !== ids.length) return "Duplicate card ids";

  const words = puzzle.cards.flatMap((card) => EDGES.map((edge) => card.words[edge]));
  if (words.some((word) => typeof word !== "string" || !word)) return "Every card needs four words";
  if (new Set(words).size !== words.length) return "Words must be unique";

  const placed = SLOTS.map((slot) => puzzle.solution[slot]);
  if (placed.some((p) => !p || !ids.includes(p.cardId) || !isRotation(p.rotation))) {
    return "Invalid solution";
  }
  if (new Set(placed.map((p) => p.cardId)).size !== SLOTS.length) {
    return "Solution must use four different cards";
  }
  return null;
}
