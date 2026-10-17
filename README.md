# Clover Puzzle

A small, mobile-first word-association game inspired by *So Clover!*, built for
playing asynchronously in a group chat.

1. Someone opens **Create New Puzzle** and gets four random word cards in a 2×2 board.
2. They write four clues, each linking the two outward-facing words along one edge.
3. **Save & Share** adds a random decoy card, shuffles all five, and produces a link.
4. Friends open the link, drag or tap cards into place, rotate them, take a
   screenshot of their answer and post it in the chat. Anyone can reveal the
   original arrangement after a confirmation.

There are no accounts, no scoring and no multiplayer: the chat app handles the social part.

## How puzzles are stored

There is no database. **Each puzzle lives entirely in its link**, `/p/<code>`,
where `<code>` is base64url of a compact binary encoding (see
[`lib/puzzle-code.ts`](lib/puzzle-code.ts)):

| Part     | Size                     | Contents                                                      |
| -------- | ------------------------ | ------------------------------------------------------------- |
| Version  | 1 byte                   | Currently `1`                                                  |
| Words    | 20 × 11 bits             | Index into the word library, 5 cards × top/right/bottom/left    |
| Solution | 4 × 5 bits               | For each slot: which card (3 bits) and its rotation (2 bits)    |
| Clues    | 4 × (1 byte + UTF-8 text) | Top, right, bottom, left                                       |

A typical puzzle's code is about 160 characters; four 60-character clues give
about 370. The links are permanent and can't be edited. Changing anything makes
a different link.

What this means in practice:

- **Nothing to set up or pay for.** No environment variables, no backend, and no public write endpoint to abuse.
- **The answer is inside the link.** Someone determined could decode it. The
  two-step Reveal button is a courtesy, not a security boundary (as intended).
- **The word library is append-only.** Codes store each word as its position
  in [`lib/word-library.ts`](lib/word-library.ts), so editing, removing or
  reordering existing words would change published puzzles. Add words at the
  end. A unit test pins the original list and fails if an existing entry changes.

Recent puzzles, drafts and each player's arrangement are kept in the browser's
`localStorage` (`clover:draft:v1`, `clover:recent:v1`, `clover:progress:<id>:v1`).
They are per-device and never synced.

If short links become important later, a tiny key-value store could map short
IDs to these codes; the encoder/decoder is the only module that would change.

## Running locally

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

## Tests

```bash
pnpm test                                  # unit tests (Vitest): rotation, placement, generation, codes, storage
pnpm exec playwright install chromium webkit
pnpm test:e2e                              # browser tests (Playwright, Chromium + WebKit)
```

The end-to-end suite builds and starts the app on port 3100. It covers tap and
drag interactions (mouse and touch), rotation, persistence across reloads,
reset and undo, reveal, sharing, and the full create → publish → solve flow.

[`tests/e2e/layout.spec.ts`](tests/e2e/layout.spec.ts) checks the solving
screen at 390×844, 375×667, 360×740 and 320×568. At each size it fails if the
page scrolls, any control is off screen, a card word leaves its card or touches
another word or a rotate button, or a clue overlaps something. It also saves
screenshots of every state to `tests/e2e/screenshots/` for visual review.

## Deploying to Vercel

1. Push the repository to GitHub.
2. In Vercel, **Add New → Project**, import the repo, and keep the detected
   Next.js settings (install `pnpm install`, build `pnpm build`).
3. Deploy. No environment variables are required.

Or from the command line: `pnpm dlx vercel` (then `vercel --prod`).

Puzzle pages render on the server so that link previews in WhatsApp and similar apps show
the puzzle number and its four clues.

## Project layout

```text
app/                    Routes: / (home), /create, /p/[code] (solve)
components/             UI: GameBoard, WordCard, ClueLabel, CardTray, SolvePuzzle,
                        CreatePuzzle, ClueEditor, RecentPuzzles, dialogs, controls
lib/
  card-rotation.ts      Which word is on which edge after rotation; clue word pairs
  placement.ts          Moving, swapping and returning cards (pure functions)
  puzzle-generator.ts   Random boards, decoy card, tray shuffle
  puzzle-code.ts        Encode/decode puzzles to and from share links
  puzzle-validation.ts  Clue rules and full-puzzle validation
  puzzle-id.ts          Short display label (#K7M4) and storage key
  local-storage.ts      Typed, versioned, crash-proof browser storage
  word-library.ts       ~1,000 everyday words (append-only)
types/puzzle.ts         Shared data types
tests/unit, tests/e2e   Vitest and Playwright suites
```

## Design notes

- Words never rotate visually. Rotating a card moves each word one edge
  clockwise; the text stays upright for readability on small screens.
- Opposite words on a card total at most 11 letters, and every puzzle uses one
  word size, chosen so its longest pair fits side by side.
- The solving screen is a CSS size container: card dimensions are computed
  from the space between the header and controls, so the whole game fits one
  screen from 320×568 up to desktop without scrolling.
- Rotate buttons sit on each card's outer corner, away from neighbouring cards.
