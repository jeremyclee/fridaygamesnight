const ID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
/** 10 base62 characters ≈ 59 bits: short links that can't realistically be guessed. */
export const PUZZLE_ID_LENGTH = 10;
const ID_PATTERN = new RegExp(`^[0-9A-Za-z]{${PUZZLE_ID_LENGTH}}$`);

/** A cryptographically random puzzle id, e.g. "8xK92mQz3L". */
export function newPuzzleId(): string {
  let id = "";
  // Reject bytes ≥ 248 (= 4 × 62) so every character is equally likely.
  while (id.length < PUZZLE_ID_LENGTH) {
    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
      if (byte < 248 && id.length < PUZZLE_ID_LENGTH) id += ID_ALPHABET[byte % 62];
    }
  }
  return id;
}

export function isPuzzleId(value: string): boolean {
  return ID_PATTERN.test(value);
}

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

/** Short display label, e.g. "K7M4". Not unique; only for telling screenshots apart. */
export function puzzleLabel(id: string): string {
  let label = "";
  let rest = hash53(id);
  for (let i = 0; i < LABEL_LENGTH; i++) {
    label += LABEL_ALPHABET[rest % LABEL_ALPHABET.length];
    rest = Math.floor(rest / LABEL_ALPHABET.length);
  }
  return label;
}
