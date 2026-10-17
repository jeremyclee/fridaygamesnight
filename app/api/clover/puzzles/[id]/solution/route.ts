import { isPuzzleId } from "@/games/clover/lib/puzzle-id";
import { loadPuzzle } from "@/games/clover/lib/puzzle-store";

/**
 * The original arrangement, fetched only after the player confirms Reveal.
 * Anyone with the link may ask for it; keeping it out of the page is a
 * courtesy against accidental spoilers, not a security boundary.
 */
export async function GET(_request: Request, context: RouteContext<"/api/clover/puzzles/[id]/solution">) {
  const { id } = await context.params;
  if (!isPuzzleId(id)) return Response.json({ error: "Invalid puzzle id." }, { status: 400 });

  try {
    const puzzle = await loadPuzzle(id);
    if (!puzzle) return Response.json({ error: "Puzzle not found." }, { status: 404 });
    // Published puzzles never change.
    return Response.json(
      { solution: puzzle.solution },
      { headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
    );
  } catch (cause) {
    console.error(`Loading the solution for ${id} failed`, cause);
    return Response.json({ error: "Couldn't load the solution. Please try again." }, { status: 503 });
  }
}
