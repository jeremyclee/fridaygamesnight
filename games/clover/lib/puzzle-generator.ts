import { normalizeClue } from "@/games/clover/lib/puzzle-validation";
import { WORDS } from "@/games/clover/lib/word-library";
import {
  EDGES,
  SLOTS,
  type CardWords,
  type Clues,
  type DraftBoard,
  type Puzzle,
  type Rotation,
  type Solution,
  type WordCard,
} from "@/games/clover/types";

/** Returns a float in [0, 1). Injected so tests can be deterministic. */
export type Rng = () => number;

export const secureRandom: Rng = () => {
  const [value] = crypto.getRandomValues(new Uint32Array(1));
  return value / 2 ** 32;
};

export function randomInt(max: number, rng: Rng): number {
  return Math.floor(rng() * max);
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, rng);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Opposite words share a row (left + right) or column (top + bottom), and
 * rotation can put either pair side by side. Keeping each pair short means
 * left and right words never collide on small screens.
 */
export const MAX_PAIR_LETTERS = 11;

export function longestPair(words: CardWords): number {
  return Math.max(words.top.length + words.bottom.length, words.left.length + words.right.length);
}

/** Put the longest word opposite the shortest so both pairs stay balanced. */
function layOutWords(four: string[], rng: Rng): CardWords {
  const [a, b, c, d] = [...four].sort((x, y) => x.length - y.length);
  const [first, second] = shuffle([shuffle([a, d], rng), shuffle([b, c], rng)], rng);
  return { top: first[0], bottom: first[1], left: second[0], right: second[1] };
}

/** Draw `count` cards of unused words. */
export function drawCards(count: number, used: Set<string>, rng: Rng): CardWords[] {
  const cards: CardWords[] = [];
  const taken = new Set(used);

  while (cards.length < count) {
    const four: string[] = [];
    while (four.length < 4) {
      const word = WORDS[randomInt(WORDS.length, rng)];
      if (!taken.has(word) && !four.includes(word)) four.push(word);
    }
    const words = layOutWords(four, rng);
    if (longestPair(words) > MAX_PAIR_LETTERS) continue;
    four.forEach((word) => taken.add(word));
    cards.push(words);
  }
  return cards;
}

/** Four random cards in fixed slots with random orientations, for the creator. */
export function generateBoard(rng: Rng = secureRandom): DraftBoard {
  return {
    cards: drawCards(4, new Set(), rng).map((words, index) => ({ id: `d${index}`, words })),
    rotations: SLOTS.map(() => randomInt(4, rng) as Rotation),
  };
}

/**
 * Turn a finished draft into a publishable puzzle: add a random decoy and
 * shuffle all five into the starting tray. Cards are re-labelled c0–c4 in tray
 * order so a puzzle decoded from its link is identical to the one encoded.
 */
export function finalizePuzzle(board: DraftBoard, clues: Clues, rng: Rng = secureRandom): Puzzle {
  const used = new Set(board.cards.flatMap((card) => Object.values(card.words)));
  const [decoy] = drawCards(1, used, rng);
  const pool: { words: CardWords; slot: number | null }[] = [
    ...board.cards.map((card, slot) => ({ words: card.words, slot })),
    { words: decoy, slot: null },
  ];

  const tray = shuffle(pool, rng);
  const cards: WordCard[] = tray.map((card, index) => ({ id: `c${index}`, words: card.words }));
  const solution = Object.fromEntries(
    SLOTS.map((slotId, slot) => {
      const index = tray.findIndex((card) => card.slot === slot);
      return [slotId, { cardId: cards[index].id, rotation: board.rotations[slot] }];
    }),
  ) as Solution;

  const normalized = Object.fromEntries(
    EDGES.map((edge) => [edge, normalizeClue(clues[edge])]),
  ) as Clues;
  return { clues: normalized, cards, solution };
}
