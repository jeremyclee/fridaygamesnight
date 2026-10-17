import type { Puzzle } from "../../../games/clover/types";
import seed from "../seed.json";

/** Fixed puzzles loaded into the test server's in-memory store (see playwright.config.ts). */
export const SAMPLE_ID = "Sample0001";
export const OTHER_ID = "Sample0002";
export const SAMPLE_PUZZLE = seed.clover[SAMPLE_ID] as Puzzle;
