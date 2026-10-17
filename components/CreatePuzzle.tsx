"use client";

import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/Button";
import { clueInputId, ClueEditor } from "@/components/ClueEditor";
import { GameBoard } from "@/components/GameBoard";
import { ShuffleIcon } from "@/components/icons";
import { Modal } from "@/components/Modal";
import { PuzzleHeader } from "@/components/PuzzleHeader";
import { cardLabel, WordCard, wordScaleFor, type WordTone } from "@/components/WordCard";
import { useIsClient } from "@/lib/browser";
import { clueWords, outerEdges, rotateWords } from "@/lib/card-rotation";
import { clearDraft, loadDraft, markJustCreated, recordRecent, saveDraft } from "@/lib/local-storage";
import { encodePuzzle } from "@/lib/puzzle-code";
import { finalizePuzzle, generateBoard } from "@/lib/puzzle-generator";
import { puzzleIds } from "@/lib/puzzle-id";
import { areCluesComplete } from "@/lib/puzzle-validation";
import { EDGES, SLOTS, type Clues, type DraftBoard, type Edge } from "@/types/puzzle";

const EMPTY_CLUES: Clues = { top: "", right: "", bottom: "", left: "" };

const hasClueText = (clues: Clues) => EDGES.some((edge) => clues[edge].trim() !== "");

export function CreatePuzzle() {
  // The board is random and the draft lives in localStorage, so render it in the browser only.
  return useIsClient() ? (
    <CreateEditor />
  ) : (
    <main className="mx-auto max-w-[520px] px-3 pt-[max(6px,env(safe-area-inset-top))]">
      <PuzzleHeader title="New Puzzle" />
    </main>
  );
}

function CreateEditor() {
  const router = useRouter();
  const [draft] = useState(loadDraft);
  const [board, setBoard] = useState<DraftBoard>(() => draft?.board ?? generateBoard());
  const [clues, setClues] = useState<Clues>(() => draft?.clues ?? EMPTY_CLUES);
  const [restored, setRestored] = useState(() => Boolean(draft && hasClueText(draft.clues)));
  const [focused, setFocused] = useState<Edge | null>(null);
  const [confirmDeal, setConfirmDeal] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetWhenHidden = useRef(false);

  useEffect(() => {
    saveDraft({ board, clues });
  }, [board, clues]);

  // After publishing, the page stays mounted in the background. Start fresh for next time.
  useLayoutEffect(
    () => () => {
      if (!resetWhenHidden.current) return;
      resetWhenHidden.current = false;
      setBoard(generateBoard());
      setClues(EMPTY_CLUES);
      setRestored(false);
      setShowErrors(false);
      setError(null);
    },
    [],
  );

  const shown = board.cards.map((card, index) => rotateWords(card.words, board.rotations[index]));
  const pairs = Object.fromEntries(EDGES.map((edge) => [edge, clueWords(shown, edge)])) as Record<
    Edge,
    [string, string]
  >;
  const complete = areCluesComplete(clues);

  function deal() {
    setBoard(generateBoard());
    setClues(EMPTY_CLUES);
    setRestored(false);
    setShowErrors(false);
    setConfirmDeal(false);
  }

  function focusClue(edge: Edge) {
    const input = document.getElementById(clueInputId(edge));
    input?.focus({ preventScroll: true });
    input?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function publish() {
    if (!complete) {
      setShowErrors(true);
      const missing = EDGES.find((edge) => !clues[edge].trim());
      if (missing) focusClue(missing);
      return;
    }
    try {
      const puzzle = finalizePuzzle(board, clues);
      const code = encodePuzzle(puzzle);
      const { key, label } = puzzleIds(code);
      recordRecent({ code, label, clues: puzzle.clues, created: true });
      markJustCreated(key);
      clearDraft();
      resetWhenHidden.current = true;
      router.push(`/p/${code}`);
    } catch {
      setError("Couldn’t save this puzzle. Your clues are still here, so please try again.");
    }
  }

  return (
    <main
      className="mx-auto max-w-[520px] px-3 pt-[max(6px,env(safe-area-inset-top))] pb-[max(28px,env(safe-area-inset-bottom))]"
      data-hydrated
    >
      <PuzzleHeader title="New Puzzle" />

      {restored ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-clover-wash px-4 py-2.5 text-sm text-clover-ink">
          <span>Picked up your unfinished puzzle.</span>
          <button type="button" className="font-semibold text-clover-dark underline-offset-2 hover:underline" onClick={() => setConfirmDeal(true)}>
            Start over
          </button>
        </div>
      ) : (
        <p className="mt-1 text-center text-sm text-ink-soft">Write a clue linking each pair of outer words.</p>
      )}

      <div className="create-area mt-4">
        <div className="board-vars flex justify-center" style={{ "--word-scale": wordScaleFor(board.cards.map((c) => c.words)) } as CSSProperties}>
          <GameBoard
            clues={clues}
            showPlaceholders
            highlightedClue={focused}
            onClueClick={focusClue}
            renderSlot={(index) => {
              const outer = outerEdges(SLOTS[index]);
              const tones = Object.fromEntries(
                EDGES.map((edge): [Edge, WordTone] => [
                  edge,
                  !outer.includes(edge) ? "muted" : focused === edge ? "highlight" : "normal",
                ]),
              );
              return <WordCard words={shown[index]} tones={tones} role="img" aria-label={cardLabel(shown[index])} />;
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex justify-center">
        <Button variant="ghost" className="h-10 text-sm" onClick={() => (hasClueText(clues) ? setConfirmDeal(true) : deal())}>
          <ShuffleIcon className="size-4" />
          Regenerate Board
        </Button>
      </div>

      <section className="mt-4" aria-label="Clues">
        <ClueEditor
          clues={clues}
          pairs={pairs}
          showErrors={showErrors}
          onFocusChange={setFocused}
          onChange={(edge, value) => {
            setClues((current) => ({ ...current, [edge]: value }));
            setError(null);
          }}
        />
      </section>

      {error && (
        <p role="alert" className="mt-4 rounded-2xl bg-[#fbeceb] px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <Button className="mt-5 w-full" onClick={publish} disabled={!complete}>
        Save &amp; Share
      </Button>
      <p className="mt-2 min-h-5 text-center text-xs text-ink-soft">
        {complete ? "Your puzzle is saved into its link. Clues can’t be edited after sharing." : "Write all four clues to share."}
      </p>

      <Modal
        open={confirmDeal}
        onClose={() => setConfirmDeal(false)}
        title="Deal new cards?"
        actions={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmDeal(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={deal}>
              New Cards
            </Button>
          </>
        }
      >
        This replaces the current cards and clears the clues you’ve written.
      </Modal>
    </main>
  );
}
