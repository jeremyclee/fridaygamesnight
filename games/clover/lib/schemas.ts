/**
 * Runtime validation for data crossing a trust boundary: puzzle-creation
 * requests from browsers, and documents read back from storage. Server only,
 * so Zod stays out of the client bundle.
 */
import { z } from "zod";
import { clueError } from "@/games/clover/lib/puzzle-validation";
import { WORDS } from "@/games/clover/lib/word-library";
import { EDGES, type Clues, type DraftBoard, type Placements, type Puzzle } from "@/games/clover/types";

const word = z.string().min(1).max(20);
const cardWords = z.object({ top: word, right: word, bottom: word, left: word });
const card = z.object({ id: z.string().min(1).max(20), words: cardWords });
const rotation = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
// Generous here; clueError applies the real (character-counted) limit.
const clue = z.string().max(400);
const clues = z.object({ top: clue, right: clue, bottom: clue, left: clue });
const placement = z.object({ cardId: z.string().max(20), rotation });

const createPuzzleRequest = z.object({
  board: z.object({ cards: z.array(card).length(4), rotations: z.array(rotation).length(4) }),
  clues,
});

const storedPuzzle = z.object({
  clues,
  cards: z.array(card).length(5),
  solution: z.object({ topLeft: placement, topRight: placement, bottomLeft: placement, bottomRight: placement }),
});

const checkRequest = z.object({ placements: z.array(placement.nullable()).length(4) });

const KNOWN_WORDS = new Set(WORDS);

export type CreatePuzzleRequest = { board: DraftBoard; clues: Clues };

export function parseCreatePuzzleRequest(
  body: unknown,
): { ok: true; value: CreatePuzzleRequest } | { ok: false; error: string } {
  const parsed = createPuzzleRequest.safeParse(body);
  if (!parsed.success) return { ok: false, error: "That doesn't look like a puzzle." };
  const { board, clues } = parsed.data;

  for (const edge of EDGES) {
    const error = clueError(clues[edge]);
    if (error) return { ok: false, error: `${edge[0].toUpperCase()}${edge.slice(1)} clue: ${error}` };
  }
  const words = board.cards.flatMap((c) => EDGES.map((edge) => c.words[edge]));
  if (!words.every((w) => KNOWN_WORDS.has(w))) return { ok: false, error: "Cards must use the built-in words." };
  if (new Set(words).size !== words.length) return { ok: false, error: "Every word must be different." };
  return { ok: true, value: { board, clues } };
}

/** Returns null for documents that don't have the expected shape. */
export function parseStoredPuzzle(data: unknown): Puzzle | null {
  const parsed = storedPuzzle.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** A board to check for a second try. Returns null if malformed. */
export function parseCheckRequest(body: unknown): Placements | null {
  const parsed = checkRequest.safeParse(body);
  return parsed.success ? parsed.data.placements : null;
}
