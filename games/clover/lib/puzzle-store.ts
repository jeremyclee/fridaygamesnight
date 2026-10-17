import "server-only";
import { cache } from "react";
import { gameCollection } from "@/lib/game-store";
import { isPuzzleId, newPuzzleId } from "@/games/clover/lib/puzzle-id";
import { puzzleError } from "@/games/clover/lib/puzzle-validation";
import { parseStoredPuzzle } from "@/games/clover/lib/schemas";
import type { Puzzle } from "@/games/clover/types";

/** Firestore collection: clover/{puzzleId}. Cards are stored in starting tray order. */
const COLLECTION = "clover";
const SCHEMA_VERSION = 1;

/** Save a finished puzzle under a fresh random id. Puzzles are never updated. */
export async function savePuzzle(puzzle: Puzzle): Promise<string> {
  const error = puzzleError(puzzle);
  if (error) throw new Error(`Refusing to save an invalid puzzle: ${error}`);

  const puzzles = gameCollection(COLLECTION);
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = newPuzzleId();
    if (await puzzles.create(id, { schemaVersion: SCHEMA_VERSION, ...puzzle })) return id;
  }
  throw new Error("Couldn't find an unused puzzle id");
}

/**
 * Load a puzzle, or null if the id is malformed, unknown or holds bad data.
 * Throws if storage itself fails. Cached per request, so the page and its
 * metadata share one read.
 */
export const loadPuzzle = cache(async (id: string): Promise<Puzzle | null> => {
  if (!isPuzzleId(id)) return null;
  const data = await gameCollection(COLLECTION).get(id);
  if (!data) return null;
  const puzzle = parseStoredPuzzle(data);
  if (!puzzle || puzzleError(puzzle)) {
    console.error(`Puzzle ${id} has invalid data`);
    return null;
  }
  return puzzle;
});
