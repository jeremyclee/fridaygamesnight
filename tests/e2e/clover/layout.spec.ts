import { expect, test } from "@playwright/test";
import { SAMPLE_ID } from "./fixtures";
import { checkBoard, fillBoard, layoutProblems, open, slot, tapPlace, VIEWPORTS } from "../helpers";

const SHOTS = "tests/e2e/screenshots/clover";

// Layout depends on the viewport, not the engine; Chromium is enough here.
test.skip(({ browserName }) => browserName !== "chromium");

for (const viewport of VIEWPORTS) {
  const size = `${viewport.width}x${viewport.height}`;

  test.describe(`at ${size}`, () => {
    test.use({ viewport, deviceScaleFactor: 2, hasTouch: true });

    test("solving screen fits on one screen in every state", async ({ page }) => {
      await open(page, `/clover/${SAMPLE_ID}`);

      expect(await layoutProblems(page)).toEqual([]);
      await page.screenshot({ path: `${SHOTS}/${size}-1-empty.png` });

      await tapPlace(page, "c1", 0);
      await tapPlace(page, "c4", 1);
      await page.getByRole("button", { name: /^Rotate TREE/ }).click();
      expect(await layoutProblems(page)).toEqual([]);
      await page.screenshot({ path: `${SHOTS}/${size}-2-partial.png` });

      await tapPlace(page, "c3", 2);
      await tapPlace(page, "c2", 3);
      await expect(page.getByRole("button", { name: "Check Board" })).toBeEnabled();
      await page.waitForTimeout(250); // let button colour transitions settle
      expect(await layoutProblems(page)).toEqual([]);
      await page.screenshot({ path: `${SHOTS}/${size}-3-complete.png` });

      await checkBoard(page);
      await page.getByRole("button", { name: "Reveal Solution" }).click();
      await page.getByRole("dialog").getByRole("button", { name: "Reveal Solution" }).click();
      await expect(page.getByText("Solution", { exact: true })).toBeVisible();
      await page.waitForTimeout(250); // let button colour transitions settle
      expect(await layoutProblems(page)).toEqual([]);
      await page.screenshot({ path: `${SHOTS}/${size}-4-solution.png` });

      await expect(slot(page, 0)).toBeVisible();
    });

    test("second try", async ({ page }) => {
      await open(page, `/clover/${SAMPLE_ID}`);
      await fillBoard(page, ["c1", "c4", "c3", "c0"]);
      await checkBoard(page);
      await expect(page.getByText("Second try · 2 of 4 right")).toBeVisible();
      await page.waitForTimeout(250);
      expect(await layoutProblems(page)).toEqual([]);
      await page.screenshot({ path: `${SHOTS}/${size}-9-second-try.png` });
    });

    test("creation screen", async ({ page }) => {
      await open(page, "/clover/create");
      await page.getByRole("textbox", { name: "Top clue", exact: true }).fill("Things in a kitchen");
      await page.getByRole("textbox", { name: "Right clue", exact: true }).fill("Red things");
      await page.getByRole("textbox", { name: "Left clue", exact: true }).focus();
      const doc = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(doc).toBeLessThanOrEqual(viewport.width);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${SHOTS}/${size}-5-create.png`, fullPage: true });
    });

    test("home and dialogs", async ({ page }) => {
      await open(page, `/clover/${SAMPLE_ID}`);
      await fillBoard(page, ["c1", "c4", "c3", "c0"]);
      await page.getByRole("button", { name: "Check Board" }).click();
      await page.waitForTimeout(250);
      await page.screenshot({ path: `${SHOTS}/${size}-6-check-dialog.png` });
      await page.goto("/clover");
      await expect(page.getByText(/Puzzle #/)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
      await page.screenshot({ path: `${SHOTS}/${size}-7-home.png` });
      await page.goto("/");
      await expect(page.getByRole("link", { name: /Clover Puzzle/ })).toBeVisible();
      await page.screenshot({ path: `${SHOTS}/${size}-8-site-home.png` });
    });
  });
}

test.describe("at desktop size", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("solving screen", async ({ page }) => {
    await open(page, `/clover/${SAMPLE_ID}`);
    await tapPlace(page, "c1", 0);
    await tapPlace(page, "c4", 1);
    expect(await layoutProblems(page)).toEqual([]);
    await page.screenshot({ path: `${SHOTS}/desktop-solve.png` });
  });

  test("home", async ({ page }) => {
    await open(page, `/clover/${SAMPLE_ID}`);
    await page.goto("/clover");
    await expect(page.getByText(/Puzzle #/)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/desktop-home.png` });
  });
});
