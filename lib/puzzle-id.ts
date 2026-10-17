/** No 0/O, 1/I/L or U, so labels read cleanly in screenshots. */
const LABEL_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const LABEL_LENGTH = 4;

/** cyrb53: a small, fast, well-distributed 53-bit string hash. */
function hash53(text: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export interface PuzzleIds {
  /** Stable id for local storage keys. */
  key: string;
  /** Short display label, e.g. "K7M4". Not unique; only for telling screenshots apart. */
  label: string;
}

export function puzzleIds(code: string): PuzzleIds {
  const hash = hash53(code);
  let label = "";
  let rest = hash;
  for (let i = 0; i < LABEL_LENGTH; i++) {
    label += LABEL_ALPHABET[rest % LABEL_ALPHABET.length];
    rest = Math.floor(rest / LABEL_ALPHABET.length);
  }
  return { key: hash.toString(36), label };
}
