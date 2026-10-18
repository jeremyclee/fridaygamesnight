import { expect, test } from "@playwright/test";
import { generateBoard } from "../../../games/clover/lib/puzzle-generator";
import { SAMPLE_ID, SAMPLE_PUZZLE } from "./fixtures";

// API behaviour doesn't depend on the browser engine.
test.skip(({ browserName }) => browserName !== "chromium");

const clues = { top: "Breakfast", right: "Outdoors", bottom: "Sparkly", left: "Loud" };

test("creates a puzzle and serves its solution separately", async ({ request }) => {
  const board = generateBoard();
  const created = await request.post("/api/clover/puzzles", { data: { board, clues } });
  expect(created.status()).toBe(201);
  const { id } = await created.json();
  expect(id).toMatch(/^[0-9A-Za-z]{10}$/);

  // The solution is the creator's board: same cards, same slots, same rotations.
  const response = await request.get(`/api/clover/puzzles/${id}/solution`);
  expect(response.status()).toBe(200);
  const { solution } = await response.json();
  expect(Object.values(solution).map((p) => (p as { rotation: number }).rotation)).toEqual(board.rotations);

  const page = await request.get(`/clover/${id}`);
  const html = await page.text();
  expect(html).toContain("Breakfast");
  expect(html).not.toContain("topLeft");
});

test("each new puzzle gets its own id", async ({ request }) => {
  const ids = new Set<string>();
  for (let i = 0; i < 5; i++) {
    const response = await request.post("/api/clover/puzzles", { data: { board: generateBoard(), clues } });
    ids.add((await response.json()).id);
  }
  expect(ids.size).toBe(5);
});

test("rejects invalid puzzles", async ({ request }) => {
  const board = generateBoard();
  const invalid = [
    { data: "not json", headers: { "Content-Type": "application/json" } },
    { data: { board } },
    { data: { board, clues: { ...clues, top: "  " } } },
    { data: { board, clues: { ...clues, top: "x".repeat(61) } } },
    { data: { board: { ...board, cards: board.cards.slice(0, 3) }, clues } },
    { data: { board: { ...board, cards: [{ ...board.cards[0], words: { ...board.cards[0].words, top: "ZZZZZ" } }, ...board.cards.slice(1)] }, clues } },
  ];
  for (const options of invalid) {
    const response = await request.post("/api/clover/puzzles", options);
    expect(response.status(), JSON.stringify(options.data).slice(0, 80)).toBe(400);
    expect((await response.json()).error).toBeTruthy();
  }

  const huge = await request.post("/api/clover/puzzles", { data: { board, clues, padding: "x".repeat(20_000) } });
  expect(huge.status()).toBe(413);
});

test("solution endpoint validates ids", async ({ request }) => {
  expect((await request.get("/api/clover/puzzles/bad!/solution")).status()).toBe(400);
  expect((await request.get("/api/clover/puzzles/Abcdef1234/solution")).status()).toBe(404);

  const response = await request.get(`/api/clover/puzzles/${SAMPLE_ID}/solution`);
  expect(await response.json()).toEqual({ solution: SAMPLE_PUZZLE.solution });
});

test("check endpoint says only which slots are right", async ({ request }) => {
  const url = `/api/clover/puzzles/${SAMPLE_ID}/check`;
  const placements = [{ cardId: "c1", rotation: 0 }, { cardId: "c4", rotation: 0 }, { cardId: "c3", rotation: 0 }, null];
  const response = await request.post(url, { data: { placements } });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ correct: [true, false, true, false] });

  expect((await request.post(url, { data: { placements: placements.slice(0, 3) } })).status()).toBe(400);
  expect((await request.post("/api/clover/puzzles/Abcdef1234/check", { data: { placements } })).status()).toBe(404);
  expect((await request.post("/api/clover/puzzles/bad!/check", { data: { placements } })).status()).toBe(400);
});
