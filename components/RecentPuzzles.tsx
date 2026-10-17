"use client";

import Link from "next/link";
import { useState } from "react";
import { useIsClient } from "@/lib/browser";
import { loadRecent, type RecentPuzzle } from "@/lib/local-storage";
import { EDGES } from "@/types/puzzle";

const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

export function RecentPuzzles() {
  const isClient = useIsClient();
  return (
    <section aria-labelledby="recent-heading" className="mt-10">
      <h2 id="recent-heading" className="px-1 text-sm font-semibold tracking-wide text-ink-soft uppercase">
        Recent puzzles
      </h2>
      {isClient ? <RecentList /> : <div className="mt-3 h-24" />}
    </section>
  );
}

function RecentList() {
  const [recent] = useState(loadRecent);

  if (recent.length === 0) {
    return (
      <p className="mt-3 rounded-3xl border border-dashed border-line px-5 py-8 text-center text-[15px] text-ink-soft">
        No puzzles yet. Make one and send it to the group chat.
      </p>
    );
  }

  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {recent.map((puzzle) => (
        <li key={puzzle.code}>
          <RecentItem puzzle={puzzle} />
        </li>
      ))}
    </ul>
  );
}

function RecentItem({ puzzle }: { puzzle: RecentPuzzle }) {
  const when = puzzle.createdAt
    ? `Created ${dateFormat.format(puzzle.createdAt)}`
    : `Opened ${dateFormat.format(puzzle.lastOpenedAt)}`;
  return (
    <Link
      href={`/p/${puzzle.code}`}
      className="block rounded-3xl border border-line bg-card px-4 py-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-[#c9d8c3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clover"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-bold tracking-tight">Puzzle #{puzzle.label}</span>
        <span className="shrink-0 text-xs text-ink-soft">{when}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-sm leading-snug text-ink-soft">
        {EDGES.map((edge) => puzzle.clues[edge]).join(" · ")}
      </p>
    </Link>
  );
}
