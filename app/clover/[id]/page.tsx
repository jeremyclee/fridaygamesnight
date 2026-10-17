import type { Metadata } from "next";
import { Suspense } from "react";
import { BrokenPuzzle } from "@/games/clover/components/BrokenPuzzle";
import { SolvePuzzle } from "@/games/clover/components/SolvePuzzle";
import { puzzleLabel } from "@/games/clover/lib/puzzle-id";
import { loadPuzzle } from "@/games/clover/lib/puzzle-store";
import { EDGES } from "@/games/clover/types";

export async function generateMetadata({ params }: PageProps<"/clover/[id]">): Promise<Metadata> {
  const { id } = await params;
  const puzzle = await loadPuzzle(id).catch(() => null);
  if (!puzzle) return { title: "Puzzle not found", robots: { index: false } };

  // Link previews (WhatsApp etc.) show the puzzle number and its clues.
  const title = `Puzzle #${puzzleLabel(id)}`;
  const description = `Clues: ${EDGES.map((edge) => puzzle.clues[edge]).join(" · ")}`;
  return {
    title,
    description,
    openGraph: { title: `Clover ${title}`, description, siteName: "Clover Puzzle", type: "website" },
    robots: { index: false },
  };
}

export default function PuzzlePage({ params }: PageProps<"/clover/[id]">) {
  return (
    <Suspense fallback={<div className="h-dvh" />}>
      {params.then(({ id }) => (
        <Puzzle id={id} />
      ))}
    </Suspense>
  );
}

async function Puzzle({ id }: { id: string }) {
  let puzzle;
  try {
    puzzle = await loadPuzzle(id);
  } catch (cause) {
    console.error(`Loading puzzle ${id} failed`, cause);
    return <BrokenPuzzle reason="unavailable" />;
  }
  if (!puzzle) return <BrokenPuzzle />;
  // The answer stays on the server until the player asks to reveal it.
  return <SolvePuzzle id={id} puzzle={{ clues: puzzle.clues, cards: puzzle.cards }} />;
}
