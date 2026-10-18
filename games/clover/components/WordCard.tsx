import type { CSSProperties, HTMLAttributes, Ref } from "react";
import { CheckIcon, RotateIcon } from "@/components/icons";
import { longestPair } from "@/games/clover/lib/puzzle-generator";
import { EDGES, type CardWords, type Edge } from "@/games/clover/types";

/**
 * Word size as a percentage of card width, shared by every card in a puzzle.
 * Opposite words can end up side by side, so the longest pair must fit across
 * the card, and the longest single word must clear the corner rotate button.
 */
export function wordScaleFor(cards: CardWords[]): number {
  const pair = Math.max(...cards.map(longestPair));
  const single = Math.max(...cards.flatMap((words) => EDGES.map((edge) => words[edge].length)));
  return Math.min(12.5, 122 / pair, 80 / single);
}

export function cardLabel(words: CardWords): string {
  return `Card: ${words.top} top, ${words.right} right, ${words.bottom} bottom, ${words.left} left`;
}

export type Corner = "tl" | "tr" | "bl" | "br";
export type WordTone = "normal" | "muted" | "highlight";

const TONES: Record<WordTone, string> = {
  normal: "text-ink",
  muted: "text-ink-faint",
  highlight: "text-clover-dark bg-clover-soft rounded-[3px] shadow-[0_0_0_0.18em_var(--color-clover-soft)]",
};

interface WordCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Words as they should appear (already rotated). */
  words: CardWords;
  faceRef?: Ref<HTMLDivElement>;
  selected?: boolean;
  /** The original stays behind, faded, while a copy is dragged. */
  ghost?: boolean;
  /** The copy that follows the pointer while dragging. */
  lifted?: boolean;
  /** A dragged card is hovering over this one. */
  targeted?: boolean;
  tones?: Partial<Record<Edge, WordTone>>;
  rotate?: { corner: Corner; label: string; onRotate: () => void };
  /** Confirmed correct by a check: tinted green, with a badge in this corner. */
  lockedCorner?: Corner;
  /** Explicit sizing for cards rendered outside the board (the drag overlay). */
  shellStyle?: CSSProperties;
}

/**
 * A card with one word on each edge. Rotation changes which edge each word
 * sits on; the text itself always stays upright.
 */
export function WordCard({
  words,
  faceRef,
  selected = false,
  ghost = false,
  lifted = false,
  targeted = false,
  tones = {},
  rotate,
  lockedCorner,
  shellStyle,
  className = "",
  ...faceProps
}: WordCardProps) {
  const word = (edge: Edge, extra: string) => (
    <span className={`${extra} ${TONES[tones[edge] ?? "normal"]}`} data-edge={edge}>
      {words[edge]}
    </span>
  );

  return (
    <div
      className={[
        "word-card card-size relative border transition-[box-shadow,opacity,transform,border-color] duration-150",
        lockedCorner ? "bg-clover-wash" : "bg-card",
        lockedCorner
          ? "border-clover shadow-[var(--shadow-card)]"
          : selected
            ? "border-clover shadow-[0_0_0_2px_var(--color-clover),var(--shadow-card)] -translate-y-0.5"
            : targeted
              ? "border-clover shadow-[0_0_0_4px_var(--color-clover-soft),var(--shadow-card)]"
              : "border-line shadow-[var(--shadow-card)]",
        lifted ? "scale-105 shadow-[var(--shadow-lift)]" : "",
        ghost ? "opacity-30" : "",
      ].join(" ")}
      style={shellStyle}
    >
      <div
        ref={faceRef}
        className={`word-card-face rounded-[inherit] outline-none focus-visible:shadow-[0_0_0_3px_var(--color-clover-soft)] ${className}`}
        {...faceProps}
      >
        {word("top", "w-top")}
        <span className="w-middle">
          {word("left", "")}
          {word("right", "")}
        </span>
        {word("bottom", "w-bottom")}
      </div>
      {lockedCorner && (
        <span className="card-badge" data-corner={lockedCorner} aria-hidden="true">
          <span className="grid place-items-center rounded-full bg-clover text-white">
            <CheckIcon className="size-[64%]" strokeWidth={3} />
          </span>
        </span>
      )}
      {rotate && (
        <button
          type="button"
          className="rotate-button group rounded-[inherit] focus-visible:outline-none"
          data-corner={rotate.corner}
          aria-label={rotate.label}
          onClick={(event) => {
            event.stopPropagation();
            rotate.onRotate();
          }}
        >
          <span className="grid place-items-center rounded-full bg-mist text-ink-soft transition-colors group-hover:bg-clover-soft group-hover:text-clover-dark group-active:bg-clover-soft group-active:text-clover-dark group-focus-visible:shadow-[0_0_0_2px_var(--color-clover)]">
            <RotateIcon className="size-[62%]" strokeWidth={2.4} />
          </span>
        </button>
      )}
    </div>
  );
}
