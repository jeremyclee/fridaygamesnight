import type { CSSProperties } from "react";
import { clueLength } from "@/games/clover/lib/puzzle-validation";
import type { Edge } from "@/games/clover/types";

/** Long clues shrink a little so they still fit their reserved space. */
function clueScale(text: string, edge: Edge): number {
  const length = clueLength(text);
  if (edge === "left" || edge === "right") return length > 40 ? 0.84 : length > 26 ? 0.92 : 1;
  return length > 46 ? 0.9 : 1;
}

interface ClueLabelProps {
  edge: Edge;
  text: string;
  /** Shown while the creator hasn't written this clue yet. */
  placeholder?: string;
  highlighted?: boolean;
  onClick?: () => void;
}

export function ClueLabel({ edge, text, placeholder, highlighted = false, onClick }: ClueLabelProps) {
  const empty = !text.trim();
  const side = edge === "left" || edge === "right";
  const className = [
    `clue clue-${edge} grid place-items-center rounded-2xl text-center font-semibold transition-colors`,
    side ? "px-1.5 py-2" : "px-3.5 py-1.5",
    empty
      ? "border-[1.5px] border-dashed border-[#c9d8c3] bg-transparent text-ink-faint font-medium"
      : "bg-clover-soft text-clover-ink",
    highlighted ? "outline-2 outline-offset-1 outline-clover" : "",
    onClick ? "cursor-text" : "",
  ].join(" ");
  const style = { "--clue-scale": clueScale(text, edge) } as CSSProperties;
  const content = <span className="clue-text">{empty ? placeholder : text}</span>;

  if (onClick) {
    return (
      <button type="button" className={className} style={style} onClick={onClick} aria-label={`Edit ${edge} clue`}>
        {content}
      </button>
    );
  }
  return (
    <div className={className} style={style} aria-label={`${edge} clue`} role="note">
      {content}
    </div>
  );
}
