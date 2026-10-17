/**
 * Typed, versioned browser storage. Every reader validates what it finds and
 * returns null for anything missing, outdated or corrupt; nothing here throws.
 * Safe to import during server rendering: storage is only touched in the browser.
 */
import { isRotation } from "@/games/clover/lib/card-rotation";
import { isValidArrangement } from "@/games/clover/lib/placement";
import { WORDS } from "@/games/clover/lib/word-library";
import {
  EDGES,
  SLOTS,
  type Arrangement,
  type Clues,
  type DraftBoard,
  type PublicPuzzle,
} from "@/games/clover/types";

const DRAFT_KEY = "clover:draft:v1";
const RECENT_KEY = "clover:recent:v2";
const JUST_CREATED_KEY = "clover:just-created:v1";
const progressKey = (puzzleId: string) => `clover:progress:${puzzleId}:v1`;

export const MAX_RECENT = 25;

type StorageKind = "local" | "session";

function storage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function readJson(key: string, kind: StorageKind = "local"): unknown {
  try {
    const raw = storage(kind)?.getItem(key);
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown, kind: StorageKind = "local"): boolean {
  try {
    const target = storage(kind);
    if (!target) return false;
    target.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string, kind: StorageKind = "local"): void {
  try {
    storage(kind)?.removeItem(key);
  } catch {
    // Storage unavailable; nothing to remove.
  }
}

const KNOWN_WORDS = new Set(WORDS);

function isClues(value: unknown): value is Clues {
  if (typeof value !== "object" || value === null) return false;
  return EDGES.every((edge) => typeof (value as Record<string, unknown>)[edge] === "string");
}

// Drafts ---------------------------------------------------------------------

export interface Draft {
  board: DraftBoard;
  clues: Clues;
}

function isDraft(value: unknown): value is Draft {
  if (typeof value !== "object" || value === null) return false;
  const { board, clues } = value as Partial<Draft>;
  if (!board || !Array.isArray(board.cards) || !Array.isArray(board.rotations)) return false;
  if (board.cards.length !== SLOTS.length || board.rotations.length !== SLOTS.length) return false;
  if (!board.rotations.every(isRotation)) return false;
  const cardsOk = board.cards.every(
    (card) =>
      typeof card?.id === "string" &&
      typeof card.words === "object" &&
      card.words !== null &&
      EDGES.every((edge) => KNOWN_WORDS.has(card.words[edge])),
  );
  return cardsOk && isClues(clues);
}

export function loadDraft(): Draft | null {
  const value = readJson(DRAFT_KEY);
  return isDraft(value) ? value : null;
}

export function saveDraft(draft: Draft): boolean {
  return writeJson(DRAFT_KEY, draft);
}

export function clearDraft(): void {
  remove(DRAFT_KEY);
}

// Recent puzzles ---------------------------------------------------------------

export interface RecentPuzzle {
  id: string;
  label: string;
  clues: Clues;
  /** Set when the puzzle was created in this browser. */
  createdAt?: number;
  lastOpenedAt: number;
}

function isRecentPuzzle(value: unknown): value is RecentPuzzle {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Partial<RecentPuzzle>;
  return (
    typeof entry.id === "string" &&
    typeof entry.label === "string" &&
    typeof entry.lastOpenedAt === "number" &&
    (entry.createdAt === undefined || typeof entry.createdAt === "number") &&
    isClues(entry.clues)
  );
}

export function loadRecent(): RecentPuzzle[] {
  const value = readJson(RECENT_KEY);
  return Array.isArray(value) ? value.filter(isRecentPuzzle) : [];
}

export function recordRecent(
  entry: { id: string; label: string; clues: Clues; created?: boolean },
  now: number = Date.now(),
): void {
  const existing = loadRecent();
  const previous = existing.find((item) => item.id === entry.id);
  const updated: RecentPuzzle = {
    id: entry.id,
    label: entry.label,
    clues: entry.clues,
    createdAt: entry.created ? now : previous?.createdAt,
    lastOpenedAt: now,
  };
  const others = existing.filter((item) => item.id !== entry.id);
  writeJson(RECENT_KEY, [updated, ...others].slice(0, MAX_RECENT));
}

// Player progress --------------------------------------------------------------

export function loadProgress(puzzleId: string, puzzle: PublicPuzzle): Arrangement | null {
  const value = readJson(progressKey(puzzleId));
  return isValidArrangement(value, puzzle) ? value : null;
}

export function saveProgress(puzzleId: string, arrangement: Arrangement): boolean {
  return writeJson(progressKey(puzzleId), arrangement);
}

// One-time "you just published this" flag, so the share prompt shows once. ----

export function markJustCreated(puzzleId: string): void {
  writeJson(JUST_CREATED_KEY, puzzleId, "session");
}

export function isJustCreated(puzzleId: string): boolean {
  return readJson(JUST_CREATED_KEY, "session") === puzzleId;
}

export function clearJustCreated(): void {
  remove(JUST_CREATED_KEY, "session");
}
