import Link from "next/link";
import { buttonClass } from "@/components/Button";
import { CloverMark, PlusIcon } from "@/components/icons";
import { RecentPuzzles } from "@/components/RecentPuzzles";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[520px] px-4 pt-[max(40px,calc(env(safe-area-inset-top)+24px))] pb-[max(32px,env(safe-area-inset-bottom))]">
      <div className="flex flex-col items-center text-center">
        <CloverMark className="size-14 text-clover" />
        <h1 className="mt-4 text-[28px] font-bold tracking-tight">Clover Puzzle</h1>
        <p className="mt-2 max-w-72 text-[15px] leading-relaxed text-ink-soft">
          Link pairs of words with four clues. Your friends rebuild the board.
        </p>
        <Link href="/create" className={buttonClass("primary", "mt-7 h-14 w-full max-w-80 text-base")}>
          <PlusIcon className="size-5" strokeWidth={2.4} />
          Create New Puzzle
        </Link>
      </div>
      <RecentPuzzles />
    </main>
  );
}
