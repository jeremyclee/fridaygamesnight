import Link from "next/link";
import { buttonClass } from "@/components/Button";
import { CloverMark } from "@/games/clover/components/CloverMark";
import { CLOVER_HOME, CREATE_PATH } from "@/games/clover/routes";

const MESSAGES = {
  missing: {
    title: "This puzzle link doesn’t work",
    body: "It may have been cut off when it was copied. Ask for the link again, or make a puzzle of your own.",
  },
  unavailable: {
    title: "Couldn’t load this puzzle",
    body: "Something went wrong on our side. Please try again in a moment.",
  },
};

export function BrokenPuzzle({ reason = "missing" }: { reason?: keyof typeof MESSAGES }) {
  const message = MESSAGES[reason];
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <CloverMark className="size-12 text-clover-soft" />
      <h1 className="mt-5 text-xl font-bold tracking-tight">{message.title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{message.body}</p>
      <Link href={CREATE_PATH} className={buttonClass("primary", "mt-7 w-full max-w-64")}>
        Create a Puzzle
      </Link>
      <Link href={CLOVER_HOME} className={buttonClass("ghost", "mt-2")}>
        Clover home
      </Link>
    </main>
  );
}
