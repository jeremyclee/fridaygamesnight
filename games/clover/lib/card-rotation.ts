import {
  EDGES,
  SLOTS,
  type CardWords,
  type Edge,
  type Rotation,
  type SlotId,
} from "@/games/clover/types";

/** Rotating clockwise moves each word one edge along: top → right → bottom → left → top. */
export function wordOnEdge(words: CardWords, rotation: Rotation, edge: Edge): string {
  const index = EDGES.indexOf(edge);
  return words[EDGES[(index - rotation + 4) % 4]];
}

/** The words on each edge after rotation. Text stays upright; only positions change. */
export function rotateWords(words: CardWords, rotation: Rotation): CardWords {
  return {
    top: wordOnEdge(words, rotation, "top"),
    right: wordOnEdge(words, rotation, "right"),
    bottom: wordOnEdge(words, rotation, "bottom"),
    left: wordOnEdge(words, rotation, "left"),
  };
}

export function rotateClockwise(rotation: Rotation): Rotation {
  return ((rotation + 1) % 4) as Rotation;
}

export function isRotation(value: unknown): value is Rotation {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

/** The two board positions each clue connects. Both cards contribute the word on the clue's edge. */
export const CLUE_SLOTS: Record<Edge, [SlotId, SlotId]> = {
  top: ["topLeft", "topRight"],
  right: ["topRight", "bottomRight"],
  bottom: ["bottomLeft", "bottomRight"],
  left: ["topLeft", "bottomLeft"],
};

/** Edges of a slot that face outward toward a clue. */
export function outerEdges(slot: SlotId): Edge[] {
  return EDGES.filter((edge) => CLUE_SLOTS[edge].includes(slot));
}

export type PlacedWords = (CardWords | null)[];

/** The pair of words a clue describes, given the words showing in each slot (SLOTS order). */
export function clueWords(placed: PlacedWords, edge: Edge): [string | null, string | null] {
  const [a, b] = CLUE_SLOTS[edge].map((slot) => placed[SLOTS.indexOf(slot)]);
  return [a?.[edge] ?? null, b?.[edge] ?? null];
}
