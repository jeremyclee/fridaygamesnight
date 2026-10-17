/** Quarter-turns clockwise. */
export type Rotation = 0 | 1 | 2 | 3;

/** Card edges in clockwise order, starting at the top. */
export const EDGES = ["top", "right", "bottom", "left"] as const;
export type Edge = (typeof EDGES)[number];

/** Board positions in reading order. Arrays indexed by slot use this order. */
export const SLOTS = ["topLeft", "topRight", "bottomLeft", "bottomRight"] as const;
export type SlotId = (typeof SLOTS)[number];

export type CardWords = Record<Edge, string>;

export interface WordCard {
  id: string;
  /** Words as the card sits at rotation 0. */
  words: CardWords;
}

export interface CardPlacement {
  cardId: string;
  rotation: Rotation;
}

export type Clues = Record<Edge, string>;

export type Solution = Record<SlotId, CardPlacement>;

export interface Puzzle {
  clues: Clues;
  /** All five cards (four solution cards plus one decoy), in starting tray order. */
  cards: WordCard[];
  solution: Solution;
}

/** What a solver sees before revealing the answer. */
export type PublicPuzzle = Omit<Puzzle, "solution">;

/** The four fixed cards a creator writes clues for. */
export interface DraftBoard {
  /** One card per slot, in SLOTS order. */
  cards: WordCard[];
  rotations: Rotation[];
}

/** A solver's current layout. */
export interface Arrangement {
  /** Card id in each slot (SLOTS order), or null when empty. */
  slots: (string | null)[];
  /** Rotation for every card, placed or not. */
  rotations: Record<string, Rotation>;
}
