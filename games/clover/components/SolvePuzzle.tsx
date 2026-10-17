"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  createContext,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { IconButton } from "@/components/Button";
import { CardTray } from "@/games/clover/components/CardTray";
import { GameBoard, SLOT_CORNERS, SLOT_NAMES } from "@/games/clover/components/GameBoard";
import { LinkIcon } from "@/components/icons";
import { PuzzleControls } from "@/games/clover/components/PuzzleControls";
import { PuzzleHeader } from "@/games/clover/components/PuzzleHeader";
import { RevealSolutionDialog } from "@/games/clover/components/RevealSolutionDialog";
import { ShareDialog } from "@/games/clover/components/ShareDialog";
import { Toast, useToast } from "@/components/Toast";
import { cardLabel, WordCard, wordScaleFor, type Corner } from "@/games/clover/components/WordCard";
import { copyText, useIsClient } from "@/lib/browser";
import { isRotation, rotateClockwise, rotateWords } from "@/games/clover/lib/card-rotation";
import {
  clearJustCreated,
  isJustCreated,
  loadProgress,
  recordRecent,
  saveProgress,
} from "@/games/clover/lib/local-storage";
import {
  emptyArrangement,
  isEmptyArrangement,
  locateCard,
  moveCard,
  slotLocation,
  TRAY,
  trayCardIds,
  type Location,
} from "@/games/clover/lib/placement";
import { puzzleLabel } from "@/games/clover/lib/puzzle-id";
import { puzzleUrl, solutionApi } from "@/games/clover/routes";
import {
  SLOTS,
  type Arrangement,
  type PublicPuzzle,
  type Rotation,
  type Solution,
  type WordCard as Card,
} from "@/games/clover/types";

/** Taps that land right after a drag are the tail end of the drag, not a tap. */
const DRAG_CLICK_GUARD_MS = 300;

function isDragTail(lastDragEnd: number): boolean {
  return performance.now() - lastDragEnd < DRAG_CLICK_GUARD_MS;
}

interface SolvePuzzleProps {
  id: string;
  /** Everything but the answer, which is fetched only when the player asks for it. */
  puzzle: PublicPuzzle;
}

export function SolvePuzzle({ id, puzzle }: SolvePuzzleProps) {
  const isClient = useIsClient();
  // Render defaults on the server and during hydration, then remount with saved progress.
  return <SolveGame key={isClient ? "client" : "server"} id={id} puzzle={puzzle} hydrated={isClient} />;
}

function isSolutionFor(value: unknown, puzzle: PublicPuzzle): value is Solution {
  if (typeof value !== "object" || value === null) return false;
  const placements = SLOTS.map((slot) => (value as Record<string, { cardId?: unknown; rotation?: unknown }>)[slot]);
  return placements.every((p) => puzzle.cards.some((card) => card.id === p?.cardId) && isRotation(p?.rotation));
}

function SolveGame({ id, puzzle, hydrated }: SolvePuzzleProps & { hydrated: boolean }) {
  const label = puzzleLabel(id);
  const cardsById = useMemo(() => new Map(puzzle.cards.map((card) => [card.id, card])), [puzzle]);
  const wordScale = useMemo(() => wordScaleFor(puzzle.cards.map((card) => card.words)), [puzzle]);

  const [arrangement, setArrangement] = useState<Arrangement>(
    () => (hydrated && loadProgress(id, puzzle)) || emptyArrangement(puzzle),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; width: number; height: number } | null>(null);
  const [view, setView] = useState<"play" | "confirm" | "solution">("play");
  const [solution, setSolution] = useState<Solution | null>(null);
  const [reveal, setReveal] = useState<{ pending: boolean; error: string | null }>({ pending: false, error: null });
  const [share, setShare] = useState<"created" | "fallback" | null>(() =>
    hydrated && isJustCreated(id) ? "created" : null,
  );
  const { toast, show: showToast, dismiss: dismissToast } = useToast();
  const lastDragEnd = useRef(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    if (!hydrated) return;
    recordRecent({ id, label, clues: puzzle.clues });
    clearJustCreated();
  }, [hydrated, id, label, puzzle.clues]);

  useEffect(() => {
    if (hydrated) saveProgress(id, arrangement);
  }, [hydrated, id, arrangement]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const shown = view === "solution" ? solution : null;
  const revealed = shown !== null;
  const solutionIds = shown ? SLOTS.map((slot) => shown[slot].cardId) : [];
  const slots = shown ? solutionIds : arrangement.slots;
  const trayIds = shown
    ? puzzle.cards.map((card) => card.id).filter((cardId) => !solutionIds.includes(cardId))
    : trayCardIds(puzzle, arrangement.slots);
  const rotationOf = (cardId: string): Rotation =>
    shown
      ? (SLOTS.map((slot) => shown[slot]).find((p) => p.cardId === cardId)?.rotation ?? 0)
      : arrangement.rotations[cardId];

  const selectedLocation = selectedId ? locateCard(arrangement.slots, selectedId) : null;
  const draggingFromSlot = dragging ? locateCard(arrangement.slots, dragging.id).kind === "slot" : false;

  // Interactions ----------------------------------------------------------------

  const move = (cardId: string, target: Location) =>
    setArrangement((current) => ({ ...current, slots: moveCard(current.slots, cardId, target) }));

  const rotate = (cardId: string) =>
    setArrangement((current) => ({
      ...current,
      rotations: { ...current.rotations, [cardId]: rotateClockwise(current.rotations[cardId]) },
    }));

  /** Tap a card: select it, or use it as the destination for the selected card. */
  function tapCard(cardId: string) {
    if (isDragTail(lastDragEnd.current)) return;
    if (!selectedId) return setSelectedId(cardId);
    if (selectedId === cardId) return setSelectedId(null);

    const tapped = locateCard(arrangement.slots, cardId);
    if (tapped.kind === "slot") {
      move(selectedId, tapped);
      setSelectedId(null);
    } else if (selectedLocation?.kind === "slot") {
      move(selectedId, TRAY);
      setSelectedId(null);
    } else {
      setSelectedId(cardId);
    }
  }

  function tapSlot(index: number) {
    if (isDragTail(lastDragEnd.current) || !selectedId) return;
    move(selectedId, slotLocation(index));
    setSelectedId(null);
  }

  function tapTray() {
    if (isDragTail(lastDragEnd.current)) return;
    if (selectedId && selectedLocation?.kind === "slot") move(selectedId, TRAY);
    setSelectedId(null);
  }

  function reset() {
    const previous = arrangement;
    setArrangement(emptyArrangement(puzzle));
    setSelectedId(null);
    showToast({ text: "Board reset", action: { label: "Undo", onClick: () => setArrangement(previous) } });
  }

  async function revealSolution() {
    if (solution) return setView("solution");
    setReveal({ pending: true, error: null });
    try {
      const response = await fetch(solutionApi(id));
      const body = (await response.json().catch(() => ({}))) as { solution?: unknown };
      if (!response.ok || !isSolutionFor(body.solution, puzzle)) throw new Error(`Solution request failed (${response.status})`);
      setSolution(body.solution);
      setView("solution");
      setReveal({ pending: false, error: null });
    } catch {
      setReveal({ pending: false, error: "Couldn’t load the answer. Check your connection and try again." });
    }
  }

  async function copyLink() {
    if (await copyText(puzzleUrl(id))) showToast({ text: "Link copied" });
    else setShare("fallback");
  }

  function onDragStart(event: DragStartEvent) {
    const rect = event.active.rect.current.initial;
    setDragging({ id: String(event.active.id), width: rect?.width ?? 0, height: rect?.height ?? 0 });
    setSelectedId(null);
  }

  function onDragEnd(event: DragEndEvent) {
    setDragging(null);
    lastDragEnd.current = performance.now();
    const target = event.over?.data.current?.target as Location | undefined;
    if (target) move(String(event.active.id), target);
  }

  // Rendering -------------------------------------------------------------------

  let hint = "Drag or tap a card to place it";
  if (revealed) hint = "The decoy";
  else if (selectedLocation?.kind === "slot") hint = "Tap a spot to move it, or the tray to remove it";
  else if (selectedLocation) hint = "Now tap a spot on the board";
  else if (trayIds.length === 1) hint = "Unused card";

  const cardProps = (cardId: string, corner?: Corner): CardViewProps => ({
    card: cardsById.get(cardId)!,
    rotation: rotationOf(cardId),
    interactive: !revealed,
    selected: selectedId === cardId,
    corner,
    onTap: () => tapCard(cardId),
    onRotate: () => rotate(cardId),
  });

  return (
    <main
      className="mx-auto flex h-dvh max-w-[520px] flex-col px-3 pt-[max(6px,env(safe-area-inset-top))] pb-[max(12px,env(safe-area-inset-bottom))]"
      data-hydrated={hydrated || undefined}
    >
      <PuzzleHeader
        title={
          <>
            <span>Puzzle #{label}</span>
            {revealed && (
              <span className="rounded-full bg-clover-soft px-2 py-0.5 text-xs font-semibold text-clover-dark">
                Solution
              </span>
            )}
          </>
        }
        action={
          <IconButton onClick={copyLink} aria-label="Copy link">
            <LinkIcon className="size-[18px]" strokeWidth={2.3} />
          </IconButton>
        }
      />

      <div className="play-area">
        <DndContext
          id="clover-solve"
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setDragging(null)}
          accessibility={{
            screenReaderInstructions: {
              draggable: "Select this card, then choose a board position. You can also drag it.",
            },
          }}
        >
          <div
            className="board-vars play-layout"
            style={{ "--word-scale": wordScale } as CSSProperties}
            onClick={() => setSelectedId(null)}
          >
            <div />
            <GameBoard
              clues={puzzle.clues}
              renderSlot={(index) => (
                <BoardSlot
                  index={index}
                  disabled={revealed}
                  selecting={selectedId !== null && slots[index] !== selectedId}
                  onTap={(event) => {
                    event.stopPropagation();
                    tapSlot(index);
                  }}
                >
                  {slots[index] && <CardView {...cardProps(slots[index], SLOT_CORNERS[index])} />}
                </BoardSlot>
              )}
            />
            <div className="flex w-full items-center gap-3 self-center px-1">
              <span className="h-px flex-1 bg-line" />
              <p className="text-center text-[13px] leading-tight font-medium text-ink-soft" aria-live="polite">
                {hint}
              </p>
              <span className="h-px flex-1 bg-line" />
            </div>
            <TrayZone
              disabled={revealed}
              highlighted={draggingFromSlot || selectedLocation?.kind === "slot"}
              onTap={(event) => {
                event.stopPropagation();
                tapTray();
              }}
              cards={trayIds.map((id) => ({ key: id, node: <CardView {...cardProps(id)} /> }))}
            />
            <div />
          </div>
          {hydrated &&
            createPortal(
              <DragOverlay dropAnimation={null}>
                {dragging && (
                  <WordCard
                    lifted
                    words={rotateWords(cardsById.get(dragging.id)!.words, arrangement.rotations[dragging.id])}
                    shellStyle={
                      { width: dragging.width, height: dragging.height, "--word-scale": wordScale } as CSSProperties
                    }
                  />
                )}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      </div>

      {revealed ? (
        <PuzzleControls mode="solution" onBack={() => setView("play")} />
      ) : (
        <PuzzleControls
          mode="play"
          canReset={!isEmptyArrangement(arrangement)}
          onReset={reset}
          onReveal={() => {
            setSelectedId(null);
            setView("confirm");
          }}
        />
      )}

      <RevealSolutionDialog
        open={view === "confirm"}
        pending={reveal.pending}
        error={reveal.error}
        onCancel={() => {
          setView("play");
          setReveal({ pending: false, error: null });
        }}
        onConfirm={revealSolution}
      />
      {hydrated && (
        <ShareDialog
          key={share ?? "closed"}
          open={share !== null}
          reason={share ?? "created"}
          url={puzzleUrl(id)}
          onClose={() => setShare(null)}
        />
      )}
      <Toast toast={toast} onDismiss={dismissToast} />
    </main>
  );
}

// Board pieces -------------------------------------------------------------------

// Lets a placed card know a drag is hovering over its slot.
const TargetContext = createContext(false);
const useTargeted = () => use(TargetContext);

interface BoardSlotProps {
  index: number;
  disabled: boolean;
  /** A card is selected and could be placed here. */
  selecting: boolean;
  onTap: (event: MouseEvent) => void;
  children: ReactNode;
}

function BoardSlot({ index, disabled, selecting, onTap, children }: BoardSlotProps) {
  const target = useMemo(() => slotLocation(index), [index]);
  const { setNodeRef, isOver, active } = useDroppable({ id: `slot-${index}`, data: { target }, disabled });
  const occupied = Boolean(children);

  return (
    <div ref={setNodeRef} className="card-size relative" data-testid={`slot-${index}`} data-over={isOver || undefined}>
      {occupied ? (
        <TargetContext value={isOver && active !== null}>{children}</TargetContext>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={onTap}
          aria-label={`Place card ${SLOT_NAMES[index]}`}
          className={[
            "word-card card-size block border-[1.5px] transition-colors",
            isOver
              ? "border-solid border-clover bg-clover-soft"
              : selecting
                ? "border-dashed border-clover/70 bg-clover-wash"
                : "border-dashed border-[#cfd7cc] bg-[#f3f5f0]",
          ].join(" ")}
        />
      )}
    </div>
  );
}

interface CardViewProps {
  card: Card;
  rotation: Rotation;
  interactive: boolean;
  selected: boolean;
  corner?: Corner;
  onTap: () => void;
  onRotate: () => void;
}

/** A card on the board or in the tray: draggable, tappable and (when placed) rotatable. */
function CardView({ card, rotation, interactive, selected, corner, onTap, onRotate }: CardViewProps) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: card.id, disabled: !interactive });
  const targeted = useTargeted();
  const words = rotateWords(card.words, rotation);

  if (!interactive) {
    return <WordCard words={words} role="img" aria-label={cardLabel(words)} data-card-id={card.id} />;
  }

  return (
    <WordCard
      words={words}
      faceRef={setNodeRef}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      aria-label={cardLabel(words)}
      aria-pressed={selected}
      data-card-id={card.id}
      className="cursor-grab touch-none active:cursor-grabbing"
      onClick={(event) => {
        event.stopPropagation();
        onTap();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onTap();
        }
      }}
      selected={selected}
      ghost={isDragging}
      targeted={targeted && !isDragging}
      rotate={corner ? { corner, label: `Rotate ${words.top} card`, onRotate } : undefined}
    />
  );
}

function TrayZone({
  disabled,
  highlighted,
  onTap,
  cards,
}: {
  disabled: boolean;
  highlighted: boolean;
  onTap: (event: MouseEvent) => void;
  cards: { key: string; node: ReactNode }[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "tray", data: { target: TRAY }, disabled });
  return (
    <CardTray
      ref={setNodeRef}
      cards={cards}
      highlighted={!disabled && highlighted && isOver}
      onClick={onTap}
      aria-label="Available cards"
      role="group"
    />
  );
}
