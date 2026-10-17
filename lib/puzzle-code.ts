/**
 * Puzzles live entirely in their share link: /p/<code>.
 *
 * The code is base64url of this byte layout:
 *
 *   version            1 byte   (currently 1)
 *   words             20 × 11 bits   index into WORDS, five cards in tray
 *                                    order, each card top/right/bottom/left
 *   solution           4 × 5 bits    per slot (TL, TR, BL, BR): card index
 *                                    (3 bits) then rotation (2 bits)
 *   clues              4 × (1 length byte + UTF-8)   top, right, bottom, left
 *
 * The first 31 bytes are fixed, so a typical puzzle is ~120 bytes (~160 chars).
 * Anyone can decode the answer from the link; the reveal button is a courtesy,
 * not a security boundary.
 */
import { puzzleError, normalizeClue } from "@/lib/puzzle-validation";
import { WORDS } from "@/lib/word-library";
import { EDGES, SLOTS, type Puzzle, type Rotation, type Solution } from "@/types/puzzle";

const VERSION = 1;
const WORD_BITS = 11;
const CARD_INDEX_BITS = 3;
const ROTATION_BITS = 2;
const MAX_CODE_LENGTH = 2000;

const WORD_INDEX = new Map(WORDS.map((word, index) => [word, index]));

export function encodePuzzle(puzzle: Puzzle): string {
  const error = puzzleError(puzzle);
  if (error) throw new Error(error);

  const bits: number[] = [];
  const write = (value: number, width: number) => {
    for (let i = width - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  for (const card of puzzle.cards) {
    for (const edge of EDGES) {
      const index = WORD_INDEX.get(card.words[edge]);
      if (index === undefined) throw new Error(`Unknown word: ${card.words[edge]}`);
      write(index, WORD_BITS);
    }
  }
  for (const slot of SLOTS) {
    const { cardId, rotation } = puzzle.solution[slot];
    write(puzzle.cards.findIndex((card) => card.id === cardId), CARD_INDEX_BITS);
    write(rotation, ROTATION_BITS);
  }

  const bytes = [VERSION, ...packBits(bits)];
  const encoder = new TextEncoder();
  for (const edge of EDGES) {
    const text = encoder.encode(normalizeClue(puzzle.clues[edge]));
    bytes.push(text.length, ...text);
  }
  return toBase64Url(Uint8Array.from(bytes));
}

/** Returns null for anything that isn't a valid puzzle code. */
export function decodePuzzle(code: string): Puzzle | null {
  if (code.length > MAX_CODE_LENGTH) return null;
  const bytes = fromBase64Url(code);
  if (!bytes || bytes[0] !== VERSION) return null;

  const fixedBits = 20 * WORD_BITS + 4 * (CARD_INDEX_BITS + ROTATION_BITS);
  const fixedBytes = Math.ceil(fixedBits / 8);
  if (bytes.length < 1 + fixedBytes) return null;

  let bit = 0;
  const read = (width: number) => {
    let value = 0;
    for (let i = 0; i < width; i++, bit++) {
      value = (value << 1) | ((bytes[1 + (bit >> 3)] >> (7 - (bit & 7))) & 1);
    }
    return value;
  };

  const cards = [];
  for (let c = 0; c < 5; c++) {
    const words = Object.fromEntries(EDGES.map((edge) => [edge, WORDS[read(WORD_BITS)]]));
    if (EDGES.some((edge) => words[edge] === undefined)) return null;
    cards.push({ id: `c${c}`, words: words as Puzzle["cards"][number]["words"] });
  }

  const solution: Partial<Solution> = {};
  for (const slot of SLOTS) {
    const card = cards[read(CARD_INDEX_BITS)];
    const rotation = read(ROTATION_BITS) as Rotation;
    if (!card) return null;
    solution[slot] = { cardId: card.id, rotation };
  }

  let offset = 1 + fixedBytes;
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const clues: Partial<Puzzle["clues"]> = {};
  for (const edge of EDGES) {
    const length = bytes[offset];
    if (length === undefined || offset + 1 + length > bytes.length) return null;
    try {
      clues[edge] = decoder.decode(bytes.subarray(offset + 1, offset + 1 + length));
    } catch {
      return null;
    }
    offset += 1 + length;
  }
  if (offset !== bytes.length) return null;

  const puzzle = { clues: clues as Puzzle["clues"], cards, solution: solution as Solution };
  return puzzleError(puzzle) ? null : puzzle;
}

function packBits(bits: number[]): number[] {
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i + j] ?? 0);
    bytes.push(byte);
  }
  return bytes;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  try {
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  } catch {
    return null;
  }
}
