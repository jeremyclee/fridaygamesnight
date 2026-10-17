import Link from "next/link";
import { CloverMark } from "@/games/clover/components/CloverMark";
import { CLOVER_HOME } from "@/games/clover/routes";

const GAMES = [
  {
    href: CLOVER_HOME,
    name: "Clover Puzzle",
    description: "Write four clues linking pairs of words. Friends rebuild the board.",
    icon: <CloverMark className="size-11 text-clover" />,
  },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-[520px] px-4 pt-[max(48px,calc(env(safe-area-inset-top)+32px))] pb-[max(32px,env(safe-area-inset-bottom))]">
      <h1 className="text-center text-[28px] font-bold tracking-tight">Friday Games Night</h1>
      <p className="mt-2 text-center text-[15px] text-ink-soft">Little games to play in the group chat.</p>
      <ul className="mt-9 flex flex-col gap-3">
        {GAMES.map((game) => (
          <li key={game.href}>
            <Link
              href={game.href}
              className="flex items-center gap-4 rounded-3xl border border-line bg-card p-4 shadow-[var(--shadow-card)] transition-colors hover:border-[#c9d8c3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clover"
            >
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-clover-wash">{game.icon}</span>
              <span>
                <span className="block text-lg font-bold tracking-tight">{game.name}</span>
                <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{game.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
