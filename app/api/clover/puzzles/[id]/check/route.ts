import { correctSlots } from "@/games/clover/lib/placement";
import { isPuzzleId } from "@/games/clover/lib/puzzle-id";
import { loadPuzzle } from "@/games/clover/lib/puzzle-store";
import { parseCheckRequest } from "@/games/clover/lib/schemas";

/**
 * Check a board for a second try. Answers only which slots are right, so the
 * full solution still stays on the server until the player reveals it.
 */
const MAX_BODY_BYTES = 2 * 1024;

export async function POST(request: Request, context: RouteContext<"/api/clover/puzzles/[id]/check">) {
  const { id } = await context.params;
  if (!isPuzzleId(id)) return Response.json({ error: "Invalid puzzle id." }, { status: 400 });

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return Response.json({ error: "Request too large." }, { status: 413 });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  const placements = parseCheckRequest(body);
  if (!placements) return Response.json({ error: "That doesn't look like a board." }, { status: 400 });

  try {
    const puzzle = await loadPuzzle(id);
    if (!puzzle) return Response.json({ error: "Puzzle not found." }, { status: 404 });
    return Response.json({ correct: correctSlots(puzzle.solution, placements) });
  } catch (cause) {
    console.error(`Checking puzzle ${id} failed`, cause);
    return Response.json({ error: "Couldn't check the board. Please try again." }, { status: 503 });
  }
}
