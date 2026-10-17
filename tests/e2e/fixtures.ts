import { encodePuzzle } from "../../lib/puzzle-code";
import type { Puzzle } from "../../types/puzzle";

/** A fixed puzzle so tests and screenshots are repeatable. */
export const SAMPLE_PUZZLE: Puzzle = {
  clues: {
    top: "Things you find in a kitchen",
    right: "Things that are red",
    bottom: "Things you find in a garden",
    left: "Types of music",
  },
  cards: [
    { id: "c0", words: { top: "STAR", right: "MOON", bottom: "SKY", left: "NIGHT" } },
    { id: "c1", words: { top: "SPOON", right: "PLATE", bottom: "FORK", left: "RIVER" } },
    { id: "c2", words: { top: "CHERRY", right: "BLOOD", bottom: "ROSE", left: "FIRE" } },
    { id: "c3", words: { top: "GUITAR", right: "JAZZ", bottom: "PIANO", left: "ROCK" } },
    { id: "c4", words: { top: "TREE", right: "APPLE", bottom: "PIE", left: "SEED" } },
  ],
  solution: {
    topLeft: { cardId: "c1", rotation: 0 },
    topRight: { cardId: "c4", rotation: 1 },
    bottomLeft: { cardId: "c3", rotation: 0 },
    bottomRight: { cardId: "c2", rotation: 2 },
  },
};

export const SAMPLE_CODE = encodePuzzle(SAMPLE_PUZZLE);
