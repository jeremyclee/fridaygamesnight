# Friday Games Night

Little games to play asynchronously in a group chat. Each game lives at its
own path on the site; the home page lists them.

| Game                         | Path      | Code             |
| ---------------------------- | --------- | ---------------- |
| [Clover Puzzle](#clover-puzzle) | `/clover` | `games/clover/`  |

## Running locally

Requires Node 22+ and pnpm.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Firebase is optional for local development. Without credentials, the dev
server keeps saved puzzles in memory (they disappear when it restarts) and logs
a warning. To use a real Firestore database locally, copy `.env.example` to
`.env.local` and fill it in (see [Firebase setup](#firebase-setup)).

## Firebase setup

Published games are stored in Firestore. No service account is needed: the
site's server uses the regular Firebase web SDK with the project's public web
config, and [`firestore.rules`](firestore.rules) lets anyone read puzzles and
create new ones, but never change or delete them.

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Build → Firestore Database → Create database**, in a region near your players.
3. **Firestore → Rules**: replace the rules with the contents of
   [`firestore.rules`](firestore.rules) and **Publish**. Or, with the Firebase CLI:
   `pnpm dlx firebase-tools deploy --only firestore:rules`.
4. **Project settings → General → Your apps → Add app → Web (</>)**. Register
   it (no hosting needed) and copy two values from the config it shows:

   | Variable              | Config field |
   | --------------------- | ------------ |
   | `FIREBASE_API_KEY`    | `apiKey`     |
   | `FIREBASE_PROJECT_ID` | `projectId`  |

These values identify the project but aren't secrets. Anyone holding them can
do only what the rules allow. Because the rules allow anonymous creates,
someone could write junk puzzles directly; the rules limit their shape and
size, and the site validates everything it saves itself. If abuse ever becomes
a problem, switch to a service account (Firebase Admin SDK) and close the rules.

### Data layout

Each game gets its own top-level collection, named after the game:

```text
clover/                     ← Clover Puzzle
  {puzzleId}                ← e.g. 8xK92mQz3L
    schemaVersion: 1
    createdAt: Timestamp
    clues: { top, right, bottom, left }
    cards: [ { id, words: { top, right, bottom, left } }, … ]   (5 cards, starting tray order)
    solution: { topLeft: { cardId, rotation }, topRight, bottomLeft, bottomRight }
<next-game>/
  …
```

Documents are only created and read; nothing is updated or deleted. Shared
plumbing is in [`lib/game-store.ts`](lib/game-store.ts) and
[`lib/firebase.ts`](lib/firebase.ts); a game calls `gameCollection("<name>")`
to get its collection, and adds a matching `match /<name>/{id}` block to
`firestore.rules`.

## Deploying to Vercel

1. Push the repository to GitHub.
2. In Vercel, **Add New → Project**, import the repo, and keep the detected
   Next.js settings.
3. Under **Settings → Environment Variables**, add `FIREBASE_API_KEY` and
   `FIREBASE_PROJECT_ID` for Production (and Preview if you want working preview
   deployments).
4. Deploy. Visiting `/` lists the games; `/clover` is Clover Puzzle.

In production the site refuses to save puzzles if the Firebase variables are
missing, rather than silently falling back to memory.

## Tests

```bash
pnpm test                                  # unit tests (Vitest)
pnpm exec playwright install chromium webkit
pnpm test:e2e                              # browser tests (Playwright, Chromium + WebKit)
```

The end-to-end suite builds and starts the site on port 3100 with an in-memory
store seeded from [`tests/e2e/seed.json`](tests/e2e/seed.json), so it never
touches Firebase.

## Project layout

```text
app/                         Routes only
  page.tsx                   Site home (list of games)
  clover/                    /clover, /clover/create, /clover/[id]
  api/clover/                POST /api/clover/puzzles, GET /api/clover/puzzles/[id]/solution
components/                  Shared UI: Button, Modal, Toast, icons
lib/                         Shared: firebase, game-store, browser helpers
games/clover/                Everything specific to Clover Puzzle
  components/                Board, cards, clues, tray, create and solve screens
  lib/                       Rotation, placement, generation, validation, storage
  clover.css                 Board sizing and card layout
  routes.ts                  Clover's paths and API endpoints
  types.ts
tests/unit/clover, tests/e2e/clover
```

To add a game, create `games/<name>/`, routes under `app/<name>/` (and
`app/api/<name>/` if it stores anything), use `gameCollection("<name>")` for
storage and open its collection in `firestore.rules`, namespace its localStorage keys with `<name>:`, and add it to the
`GAMES` list in `app/page.tsx`.

---

## Clover Puzzle

A mobile-first word-association game inspired by *So Clover!*

1. **Create New Puzzle** deals four random word cards into a 2×2 board.
2. The creator writes four clues, each linking the two outward-facing words along one edge.
3. **Save & Share** sends the board to the server, which adds a random decoy
   card, shuffles all five, stores the puzzle and returns a short link like
   `/clover/8xK92mQz3L`.
4. Friends open the link, drag or tap cards into place, rotate them, screenshot
   their answer and post it in the chat. Anyone can reveal the original
   arrangement after a confirmation.

There are no accounts, scores or answer checking; the chat handles that.

### API

| Endpoint                                  | Purpose                                                      |
| ----------------------------------------- | ------------------------------------------------------------ |
| `POST /api/clover/puzzles`                | Body `{ board, clues }`. Validates, finalizes and stores; returns `{ id }`. |
| `GET /api/clover/puzzles/[id]/solution`   | The original arrangement, fetched only after the player confirms Reveal. |

Puzzle pages render on the server, sending clues and cards but not the
solution. Link previews in WhatsApp and similar apps show the puzzle number
and clues.

**Abuse.** Creating puzzles is public and unauthenticated by design. The
endpoint accepts bodies up to 8 KB, only words from the built-in library, and
clues of at most 60 characters; the server chooses the decoy and tray order.
Someone could still script many puzzle creations, through the API or
directly against Firestore with the public config (the rules bound each
document's shape and size). Firestore's free tier (20k writes/day) caps the
cost. If it ever becomes a problem, move to a service account with closed
rules, and add rate limiting (for example Vercel's firewall rules) before
reaching for CAPTCHAs or accounts. Reading a solution needs only the link, which is intentional: the
two-step reveal prevents accidental spoilers, not determined ones.

### Browser storage

Drafts, recent puzzles and each player's arrangement live in `localStorage`
under `clover:draft:v1`, `clover:recent:v2` and `clover:progress:<id>:v1`. They
are per device and never synced. Corrupt or outdated values are ignored.

### Design notes

- Words never rotate visually. Rotating a card moves each word one edge
  clockwise; the text stays upright for readability on small screens.
- Opposite words on a card total at most 11 letters, and every puzzle uses one
  word size, chosen so its longest pair fits side by side.
- The solving screen is a CSS size container: card dimensions are computed
  from the space between the header and controls, so the whole game fits one
  screen from 320×568 up to desktop without scrolling.
- Rotate buttons sit on each card's outer corner, away from neighbouring cards.
- [`tests/e2e/clover/layout.spec.ts`](tests/e2e/clover/layout.spec.ts) checks
  390×844, 375×667, 360×740 and 320×568 for scrolling, off-screen controls and
  overlapping words or clues, and saves screenshots of each state to
  `tests/e2e/screenshots/clover/`.
