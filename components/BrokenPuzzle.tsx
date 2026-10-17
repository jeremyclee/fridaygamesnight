import Link from "next/link";
import { buttonClass } from "@/components/Button";
import { CloverMark } from "@/components/icons";

export function BrokenPuzzle() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <CloverMark className="size-12 text-clover-soft" />
      <h1 className="mt-5 text-xl font-bold tracking-tight">This puzzle link doesn’t work</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
        It may have been cut off when it was copied. Ask for the link again, or make a puzzle of your own.
      </p>
      <Link href="/create" className={buttonClass("primary", "mt-7 w-full max-w-64")}>
        Create a Puzzle
      </Link>
      <Link href="/" className={buttonClass("ghost", "mt-2")}>
        Go home
      </Link>
    </main>
  );
}
