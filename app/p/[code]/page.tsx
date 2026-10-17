import type { Metadata } from "next";
import { Suspense } from "react";
import { BrokenPuzzle } from "@/components/BrokenPuzzle";
import { SolvePuzzle } from "@/components/SolvePuzzle";
import { decodePuzzle } from "@/lib/puzzle-code";
import { puzzleIds } from "@/lib/puzzle-id";
import { EDGES } from "@/types/puzzle";

export async function generateMetadata({ params }: PageProps<"/p/[code]">): Promise<Metadata> {
  const { code } = await params;
  const puzzle = decodePuzzle(code);
  if (!puzzle) return { title: "Puzzle not found", robots: { index: false } };

  const title = `Puzzle #${puzzleIds(code).label}`;
  const description = `Clues: ${EDGES.map((edge) => puzzle.clues[edge]).join(" · ")}`;
  return {
    title,
    description,
    openGraph: { title: `Clover ${title}`, description, siteName: "Clover Puzzle", type: "website" },
    robots: { index: false },
  };
}

export default function PuzzlePage({ params }: PageProps<"/p/[code]">) {
  return (
    <Suspense fallback={<div className="h-dvh" />}>
      {params.then(({ code }) => (decodePuzzle(code) ? <SolvePuzzle code={code} /> : <BrokenPuzzle />))}
    </Suspense>
  );
}
