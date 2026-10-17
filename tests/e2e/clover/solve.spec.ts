import { expect, test, type Page } from "@playwright/test";
import { OTHER_ID, SAMPLE_ID, SAMPLE_PUZZLE } from "./fixtures";
import { card, cardWords, drag, open, slot, tapPlace, tray } from "../helpers";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

const PUZZLE = `/clover/${SAMPLE_ID}`;

async function slotContents(page: Page) {
  return Promise.all(
    [0, 1, 2, 3].map((i) => slot(page, i).locator("[data-card-id]").getAttribute("data-card-id", { timeout: 200 }).catch(() => null)),
  );
}

async function trayContents(page: Page) {
  return tray(page).locator("[data-card-id]").evaluateAll((nodes) => nodes.map((n) => n.getAttribute("data-card-id")));
}

async function expectAllCardsAccountedFor(page: Page) {
  const placed = (await slotContents(page)).filter(Boolean);
  const inTray = await trayContents(page);
  expect([...placed, ...inTray].sort()).toEqual(["c0", "c1", "c2", "c3", "c4"]);
}

test("starts with an empty board, five cards and no visible answer", async ({ page }) => {
  await open(page, PUZZLE);
  expect(await slotContents(page)).toEqual([null, null, null, null]);
  expect(await trayContents(page)).toEqual(["c0", "c1", "c2", "c3", "c4"]);
  for (const clue of Object.values(SAMPLE_PUZZLE.clues)) await expect(page.getByText(clue)).toBeVisible();

  // The answer isn't sent to the browser until the player asks for it.
  const html = await (await page.request.get(PUZZLE)).text();
  expect(html).not.toContain("topLeft");
  expect(html).not.toContain("rotation");
});

test("tap to place, swap, replace and return cards", async ({ page }) => {
  await open(page, PUZZLE);

  await tapPlace(page, "c1", 0);
  await tapPlace(page, "c4", 1);
  expect(await slotContents(page)).toEqual(["c1", "c4", null, null]);

  // Selected card shows as pressed.
  await card(page, "c1").click();
  await expect(card(page, "c1")).toHaveAttribute("aria-pressed", "true");
  // Tap another placed card to swap.
  await card(page, "c4").click();
  expect(await slotContents(page)).toEqual(["c4", "c1", null, null]);

  // Tray card onto an occupied slot: the occupant goes back to the tray.
  await card(page, "c0").click();
  await card(page, "c4").click();
  expect(await slotContents(page)).toEqual(["c0", "c1", null, null]);
  expect(await trayContents(page)).toContain("c4");

  // Placed card back to the tray by tapping the tray.
  await card(page, "c0").click();
  const trayBox = (await tray(page).boundingBox())!;
  await tray(page).click({ position: { x: 3, y: trayBox.height / 2 } });
  expect(await slotContents(page)).toEqual([null, "c1", null, null]);

  // ...or by tapping a card in the tray.
  await card(page, "c1").click();
  await card(page, "c3").click();
  expect(await slotContents(page)).toEqual([null, null, null, null]);
  await expectAllCardsAccountedFor(page);
});

test("drag and drop cards", async ({ page }) => {
  await open(page, PUZZLE);

  await drag(page, card(page, "c2"), slot(page, 3));
  expect(await slotContents(page)).toEqual([null, null, null, "c2"]);

  // Placed card to an empty slot.
  await drag(page, card(page, "c2"), slot(page, 0));
  expect(await slotContents(page)).toEqual(["c2", null, null, null]);

  // Tray card onto an occupied slot.
  await drag(page, card(page, "c3"), slot(page, 0));
  expect(await slotContents(page)).toEqual(["c3", null, null, null]);
  expect(await trayContents(page)).toContain("c2");

  // Placed card onto another placed card swaps them.
  await drag(page, card(page, "c1"), slot(page, 1));
  await drag(page, card(page, "c3"), slot(page, 1));
  expect(await slotContents(page)).toEqual(["c1", "c3", null, null]);

  // Back to the tray.
  await drag(page, card(page, "c3"), tray(page));
  expect(await slotContents(page)).toEqual(["c1", null, null, null]);
  await expectAllCardsAccountedFor(page);
});

test("rotating moves words clockwise while keeping text upright", async ({ page }) => {
  await open(page, PUZZLE);
  await tapPlace(page, "c1", 0);
  const placed = card(page, "c1");

  expect(await cardWords(placed)).toEqual({ top: "SPOON", right: "PLATE", bottom: "FORK", left: "RIVER" });
  const rotateButton = page.getByRole("button", { name: /^Rotate .* card$/ });
  await rotateButton.click();
  expect(await cardWords(placed)).toEqual({ top: "RIVER", right: "SPOON", bottom: "PLATE", left: "FORK" });

  // No CSS rotation anywhere on the card.
  const transforms = await placed.evaluate((node) =>
    [node, node.parentElement!, ...node.querySelectorAll("span")].map((el) => getComputedStyle(el).rotate + getComputedStyle(el).transform),
  );
  for (const value of transforms) expect(value).not.toMatch(/deg|matrix\((?!1, 0, 0, 1)/);

  for (let i = 0; i < 3; i++) await rotateButton.click();
  expect(await cardWords(placed)).toEqual({ top: "SPOON", right: "PLATE", bottom: "FORK", left: "RIVER" });
});

test("progress and rotations survive a reload; reset clears them", async ({ page }) => {
  await open(page, PUZZLE);
  await tapPlace(page, "c1", 0);
  await tapPlace(page, "c3", 3);
  const rotate = slot(page, 3).getByRole("button", { name: /^Rotate/ });
  await rotate.click();
  await rotate.click();

  const before = await cardWords(card(page, "c3"));
  await page.reload();
  await expect(page.locator("main[data-hydrated]")).toBeVisible();
  expect(await slotContents(page)).toEqual(["c1", null, null, "c3"]);
  expect(await cardWords(card(page, "c3"))).toEqual(before);

  await page.getByRole("button", { name: "Reset" }).click();
  expect(await slotContents(page)).toEqual([null, null, null, null]);
  expect(await cardWords(card(page, "c3"))).toEqual(SAMPLE_PUZZLE.cards[3].words);

  // Undo brings it back; resetting again sticks after reload.
  await page.getByRole("button", { name: "Undo" }).click();
  expect(await slotContents(page)).toEqual(["c1", null, null, "c3"]);
  await page.getByRole("button", { name: "Reset" }).click();
  await page.reload();
  await expect(page.locator("main[data-hydrated]")).toBeVisible();
  expect(await slotContents(page)).toEqual([null, null, null, null]);
});

test("each puzzle keeps its own progress", async ({ page }) => {
  await open(page, PUZZLE);
  await tapPlace(page, "c1", 0);

  await open(page, `/clover/${OTHER_ID}`);
  expect(await slotContents(page)).toEqual([null, null, null, null]);

  await open(page, PUZZLE);
  expect(await slotContents(page)).toEqual(["c1", null, null, null]);
});

test("revealing the solution needs confirmation and keeps the player's board", async ({ page }) => {
  await open(page, PUZZLE);
  await tapPlace(page, "c0", 0);
  await tapPlace(page, "c2", 1);

  await page.getByRole("button", { name: "Reveal Solution" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("This will reveal the original card arrangement.");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  expect(await slotContents(page)).toEqual(["c0", "c2", null, null]);

  await page.getByRole("button", { name: "Reveal Solution" }).click();
  await dialog.getByRole("button", { name: "Reveal Solution" }).click();
  await expect(page.getByText("Solution", { exact: true })).toBeVisible();

  const { solution, cards } = SAMPLE_PUZZLE;
  const expected = [solution.topLeft, solution.topRight, solution.bottomLeft, solution.bottomRight];
  expect(await slotContents(page)).toEqual(expected.map((p) => p.cardId));
  // c4 is solved at rotation 1: its left word (SEED) moves to the top.
  expect(await cardWords(slot(page, 1).locator("[data-card-id]"))).toEqual({
    top: "SEED",
    right: "TREE",
    bottom: "APPLE",
    left: "PIE",
  });
  expect(await cardWords(slot(page, 3).locator("[data-card-id]"))).toEqual({
    top: "ROSE",
    right: "FIRE",
    bottom: "CHERRY",
    left: "BLOOD",
  });
  expect(await trayContents(page)).toEqual(["c0"]);
  expect(cards.map((c) => c.id).filter((id) => !expected.some((p) => p.cardId === id))).toEqual(["c0"]);

  await page.getByRole("button", { name: "Back to Puzzle" }).click();
  expect(await slotContents(page)).toEqual(["c0", "c2", null, null]);
});

test("copy link puts the puzzle URL on the clipboard", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Clipboard permissions are Chromium-only in Playwright");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, PUZZLE);
  await page.getByRole("button", { name: "Copy link" }).click();
  await expect(page.getByText("Link copied")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(new URL(PUZZLE, page.url()).href);
});

test("opened puzzles appear on the home page", async ({ page }) => {
  await open(page, PUZZLE);
  const label = (await page.getByRole("heading", { level: 1 }).textContent())!;
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.getByRole("link", { name: new RegExp(label.replace("#", "\\#")) })).toBeVisible();
  await expect(page.getByText(/Opened/)).toBeVisible();
});

test("broken and truncated links show a friendly message", async ({ page }) => {
  // Malformed, cut off, and well-formed but unknown.
  for (const path of ["/clover/not-a-puzzle", `/clover/${SAMPLE_ID.slice(0, 6)}`, "/clover/Abcdef1234"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "This puzzle link doesn’t work" })).toBeVisible();
  }
});

test("touch dragging works", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Uses Chrome DevTools touch emulation");
  await open(page, PUZZLE);
  const client = await page.context().newCDPSession(page);
  const touch = (type: "touchStart" | "touchMove" | "touchEnd", x = 0, y = 0) =>
    client.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x, y }] });

  const from = (await card(page, "c4").boundingBox())!;
  const to = (await slot(page, 2).boundingBox())!;
  const [x0, y0] = [from.x + from.width / 2, from.y + from.height / 2];
  const [x1, y1] = [to.x + to.width / 2, to.y + to.height / 2];
  await touch("touchStart", x0, y0);
  for (let i = 1; i <= 10; i++) await touch("touchMove", x0 + ((x1 - x0) * i) / 10, y0 + ((y1 - y0) * i) / 10);
  await touch("touchEnd");

  expect(await slotContents(page)).toEqual([null, null, "c4", null]);
  // The tap that ends a drag must not also select the card.
  await expect(card(page, "c4")).toHaveAttribute("aria-pressed", "false");
});

test("reveal can be retried if the answer fails to load", async ({ page }) => {
  await open(page, PUZZLE);
  await page.route("**/solution", (route) => route.abort());
  await page.getByRole("button", { name: "Reveal Solution" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Reveal Solution" }).click();
  await expect(dialog.getByRole("alert")).toContainText("Couldn’t load the answer");

  await page.unroute("**/solution");
  await dialog.getByRole("button", { name: "Try Again" }).click();
  await expect(page.getByText("Solution", { exact: true })).toBeVisible();
});
