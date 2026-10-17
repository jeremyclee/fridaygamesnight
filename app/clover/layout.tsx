import type { Metadata } from "next";
import "@/games/clover/clover.css";

export const metadata: Metadata = {
  title: {
    default: "Clover Puzzle",
    template: "%s · Clover Puzzle",
  },
  description: "A word-association puzzle to share with friends. Write four clues; they rebuild the board.",
};

export default function CloverLayout({ children }: LayoutProps<"/clover">) {
  return children;
}
