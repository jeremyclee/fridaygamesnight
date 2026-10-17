import type { Metadata } from "next";
import { CreatePuzzle } from "@/components/CreatePuzzle";

export const metadata: Metadata = {
  title: "New Puzzle",
};

export default function CreatePage() {
  return <CreatePuzzle />;
}
