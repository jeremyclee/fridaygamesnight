import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "@/components/icons";

interface PuzzleHeaderProps {
  title: ReactNode;
  /** Optional button on the right, e.g. Copy Link. */
  action?: ReactNode;
}

export function PuzzleHeader({ title, action }: PuzzleHeaderProps) {
  return (
    <header className="grid h-12 shrink-0 grid-cols-[40px_1fr_40px] items-center gap-2">
      <Link
        href="/"
        aria-label="Home"
        className="grid size-10 place-items-center rounded-full bg-mist text-ink transition-colors hover:bg-mist-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clover"
      >
        <ArrowLeftIcon className="size-5" strokeWidth={2.4} />
      </Link>
      <h1 className="flex items-center justify-center gap-2 truncate text-center text-[17px] font-bold tracking-tight">
        {title}
      </h1>
      {action ?? <span />}
    </header>
  );
}
