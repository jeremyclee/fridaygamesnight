import { expect, test, type Page } from "@playwright/test";
import { checkBoard, fillBoard, open } from "../helpers";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

const CLUES = {
  "Top clue": "Breakfast things",
  "Right clue": "Found outdoors",
  "Bottom clue": "Things that sparkle",
  "Left clue": "Loud noises",
};

const clueInput = (page: Page, name: string) => page.getByRole("textbox", { name, exact: true });

/** Card labels on the board, in slot order (top left, top right, bottom left, bottom right). */
async function boardCards(page: Page) {
  return page
    .getByTestId("board")
    .filter({ visible: true })
    .locator("[aria-label^='Card:']")
    .evaluateAll((nodes) => nodes.map((n) => n.getAttribute("aria-label")));
}

test("create, publish and solve a puzzle", async ({ page }) => {
  await open(page, "/clover/create");
  const save = page.getByRole("button", { name: "Save & Share" });
  await expect(save).toBeDisabled();

  // Clues show on the board as they're typed.
  await clueInput(page, "Top clue").fill(CLUES["Top clue"]);
  await expect(page.getByRole("button", { name: "Edit top clue" })).toHaveText(CLUES["Top clue"]);
  await clueInput(page, "Right clue").fill(CLUES["Right clue"]);

  // The draft survives a reload, cards and all.
  const cards = await boardCards(page);
  expect(cards).toHaveLength(4);
  await page.reload();
  await expect(page.locator("main[data-hydrated]")).toBeVisible();
  expect(await boardCards(page)).toEqual(cards);
  await expect(clueInput(page, "Top clue")).toHaveValue(CLUES["Top clue"]);
  await expect(page.getByText("Picked up your unfinished puzzle.")).toBeVisible();

  await clueInput(page, "Bottom clue").fill(CLUES["Bottom clue"]);
  await expect(save).toBeDisabled();
  await clueInput(page, "Left clue").fill("   ");
  await expect(save).toBeDisabled();
  await clueInput(page, "Left clue").fill(CLUES["Left clue"]);
  await expect(save).toBeEnabled();
  await save.click();

  await expect(page).toHaveURL(/\/clover\/[0-9A-Za-z]{10}$/);
  const share = page.getByRole("dialog");
  await expect(share).toContainText("Your puzzle is ready");
  await expect(share.getByRole("textbox", { name: "Puzzle link" })).toHaveValue(page.url());
  await share.getByRole("button", { name: "Done" }).click();

  // A fresh board with five cards, and the creator's arrangement as the answer.
  await expect(page.locator("[data-testid^='slot-'] button").filter({ visible: true })).toHaveCount(4);
  await expect(page.getByTestId("tray").filter({ visible: true }).locator("[data-card-id]")).toHaveCount(5);
  for (const clue of Object.values(CLUES)) {
    await expect(page.getByText(clue).filter({ visible: true })).toBeVisible();
  }

  // Any four cards, then check, unlocks the solution.
  await fillBoard(page, ["c0", "c1", "c2", "c3"]);
  await checkBoard(page);
  await page.getByRole("button", { name: "Reveal Solution" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Reveal Solution" }).click();
  await expect(page.getByText("Solution", { exact: true })).toBeVisible();
  expect(await boardCards(page)).toEqual(cards);

  // The share prompt only appears once.
  await page.reload();
  await expect(page.locator("main[data-hydrated]")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();

  // Listed on the home page as created here, and the draft is gone.
  await page.getByRole("link", { name: "Back" }).click();
  await expect(page.getByText(/Created/)).toBeVisible();
  await expect(page.getByText(CLUES["Top clue"], { exact: false }).filter({ visible: true })).toBeVisible();
  await page.getByRole("link", { name: "Create New Puzzle" }).click();
  await expect(page.locator("main[data-hydrated]").filter({ visible: true })).toBeVisible();
  await expect(clueInput(page, "Top clue")).toHaveValue("");
  expect(await boardCards(page)).not.toEqual(cards);
});

test("regenerating asks before discarding clues", async ({ page }) => {
  await open(page, "/clover/create");
  const cards = await boardCards(page);
  await clueInput(page, "Top clue").fill("Something");

  await page.getByRole("button", { name: "Regenerate Board" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("clears the clues");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  expect(await boardCards(page)).toEqual(cards);
  await expect(clueInput(page, "Top clue")).toHaveValue("Something");

  await page.getByRole("button", { name: "Regenerate Board" }).click();
  await dialog.getByRole("button", { name: "New Cards" }).click();
  expect(await boardCards(page)).not.toEqual(cards);
  await expect(clueInput(page, "Top clue")).toHaveValue("");

  // With no clues written there's nothing to lose, so no confirmation.
  const next = await boardCards(page);
  await page.getByRole("button", { name: "Regenerate Board" }).click();
  await expect(dialog).toBeHidden();
  expect(await boardCards(page)).not.toEqual(next);
});

test("clues are limited to 60 characters", async ({ page }) => {
  await open(page, "/clover/create");
  await clueInput(page, "Top clue").fill("x".repeat(75));
  await expect(clueInput(page, "Top clue")).toHaveValue("x".repeat(60));
  await expect(page.getByText("60/60")).toBeVisible();
});

test("tapping a clue on the board focuses its field", async ({ page }) => {
  await open(page, "/clover/create");
  await page.getByRole("button", { name: "Edit right clue" }).click();
  await expect(clueInput(page, "Right clue")).toBeFocused();
});

test("a failed save keeps the draft and can be retried", async ({ page }) => {
  await open(page, "/clover/create");
  for (const [name, value] of Object.entries(CLUES)) await clueInput(page, name).fill(value);

  await page.route("**/api/clover/puzzles", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Storage is down." }) }),
  );
  await page.getByRole("button", { name: "Save & Share" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Couldn’t save" })).toContainText("Storage is down.");
  await expect(clueInput(page, "Top clue")).toHaveValue(CLUES["Top clue"]);

  await page.reload();
  await expect(page.locator("main[data-hydrated]")).toBeVisible();
  await expect(clueInput(page, "Left clue")).toHaveValue(CLUES["Left clue"]);

  await page.unroute("**/api/clover/puzzles");
  await page.getByRole("button", { name: "Save & Share" }).click();
  await expect(page).toHaveURL(/\/clover\/[0-9A-Za-z]{10}$/);
});
