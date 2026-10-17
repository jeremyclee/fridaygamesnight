import Link from "next/link";
import { buttonClass } from "@/components/Button";
import { ArrowLeftIcon, PlusIcon } from "@/components/icons";
import { CloverMark } from "@/games/clover/components/CloverMark";
import { RecentPuzzles } from "@/games/clover/components/RecentPuzzles";
import { CREATE_PATH } from "@/games/clover/routes";

export default function CloverHome() {
  return (
    <main className="mx-auto w-full max-w-[520px] px-4 pt-[max(12px,env(safe-area-inset-top))] pb-[max(32px,env(safe-area-inset-bottom))]">
      <Link
        href="/"
        className="-ml-2 inline-flex h-10 items-center gap-1 rounded-full px-2 text-sm font-medium text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-clover"
      >
        <ArrowLeftIcon className="size-4" strokeWidth={2.4} />
        All games
      </Link>
      <div className="mt-6 flex flex-col items-center text-center">
        <CloverMark className="size-14 text-clover" />
        <h1 className="mt-4 text-[28px] font-bold tracking-tight">Clover Puzzle</h1>
        <p className="mt-2 max-w-72 text-[15px] leading-relaxed text-ink-soft">
          Link pairs of words with four clues. Your friends rebuild the board.
        </p>
        <Link href={CREATE_PATH} className={buttonClass("primary", "mt-7 h-14 w-full max-w-80 text-base")}>
          <PlusIcon className="size-5" strokeWidth={2.4} />
          Create New Puzzle
        </Link>
      </div>
      <RecentPuzzles />
    </main>
  );
}
