import Link from "next/link";
import { buttonClass } from "@/components/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-2 text-[15px] text-ink-soft">There’s nothing at this address.</p>
      <Link href="/" className={buttonClass("primary", "mt-7 w-full max-w-64")}>
        All games
      </Link>
    </main>
  );
}
