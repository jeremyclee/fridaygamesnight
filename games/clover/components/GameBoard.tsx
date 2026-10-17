import type { ReactNode } from "react";
import { ClueLabel } from "@/games/clover/components/ClueLabel";
import type { Corner } from "@/games/clover/components/WordCard";
import { EDGES, SLOTS, type Clues, type Edge } from "@/games/clover/types";

/** Rotate buttons sit on each card's outer corner, away from the other cards. */
export const SLOT_CORNERS: Corner[] = ["tl", "tr", "bl", "br"];

export const SLOT_NAMES = ["top left", "top right", "bottom left", "bottom right"];

const CLUE_PLACEHOLDERS: Record<Edge, string> = {
  top: "1 · Top clue",
  right: "2 · Right",
  bottom: "3 · Bottom clue",
  left: "4 · Left",
};

interface GameBoardProps {
  clues: Clues;
  /** Render a single slot's content (card or empty target), by SLOTS index. */
  renderSlot: (index: number) => ReactNode;
  showPlaceholders?: boolean;
  highlightedClue?: Edge | null;
  onClueClick?: (edge: Edge) => void;
}

/** Four clues around a 2×2 grid of cards. Shared by creating, solving and the solution. */
export function GameBoard({ clues, renderSlot, showPlaceholders, highlightedClue, onClueClick }: GameBoardProps) {
  return (
    <div className="board-grid" data-testid="board">
      {EDGES.map((edge) => (
        <ClueLabel
          key={edge}
          edge={edge}
          text={clues[edge]}
          placeholder={showPlaceholders ? CLUE_PLACEHOLDERS[edge] : undefined}
          highlighted={highlightedClue === edge}
          onClick={onClueClick ? () => onClueClick(edge) : undefined}
        />
      ))}
      {SLOTS.map((slot, index) => (
        <div
          key={slot}
          className="card-size"
          style={{ gridColumn: 2 + (index % 2), gridRow: 2 + Math.floor(index / 2) }}
        >
          {renderSlot(index)}
        </div>
      ))}
    </div>
  );
}
