import { finalizePuzzle } from "@/games/clover/lib/puzzle-generator";
import { savePuzzle } from "@/games/clover/lib/puzzle-store";
import { parseCreatePuzzleRequest } from "@/games/clover/lib/schemas";
import { StorageNotConfiguredError } from "@/lib/game-store";

/**
 * Create a puzzle. Public and unauthenticated by design, so it only accepts
 * small bodies, only built-in words, and clues within the length limit. The
 * server adds the decoy and shuffles the tray; the browser never chooses them.
 */
const MAX_BODY_BYTES = 8 * 1024;

export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return error(413, "That puzzle is too large.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return error(413, "That puzzle is too large.");

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return error(400, "That doesn't look like a puzzle.");
  }
  const parsed = parseCreatePuzzleRequest(body);
  if (!parsed.ok) return error(400, parsed.error);

  try {
    const id = await savePuzzle(finalizePuzzle(parsed.value.board, parsed.value.clues));
    return Response.json({ id }, { status: 201 });
  } catch (cause) {
    console.error("Saving a Clover puzzle failed", cause);
    return error(
      503,
      cause instanceof StorageNotConfiguredError
        ? "Puzzle storage isn't set up yet."
        : "Couldn't save the puzzle. Please try again.",
    );
  }
}

function error(status: number, message: string) {
  return Response.json({ error: message }, { status });
}
