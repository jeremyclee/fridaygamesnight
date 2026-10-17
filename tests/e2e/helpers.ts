import { expect, type Locator, type Page } from "@playwright/test";

export const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 360, height: 740 },
  { width: 320, height: 568 },
] as const;

/** Open a page and wait until saved state has been restored and handlers are live. */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await expect(page.locator("main[data-hydrated]").filter({ visible: true })).toBeVisible();
}

/** Visible card by id (hidden copies can linger in preserved routes). */
export function card(page: Page, id: string): Locator {
  return page.locator(`[data-card-id="${id}"]`).filter({ visible: true });
}

export function slot(page: Page, index: number): Locator {
  return page.getByTestId(`slot-${index}`).filter({ visible: true });
}

export function tray(page: Page): Locator {
  return page.getByTestId("tray").filter({ visible: true });
}

/** Place a card using tap-to-select. */
export async function tapPlace(page: Page, id: string, slotIndex: number) {
  await card(page, id).click();
  await slot(page, slotIndex).click();
  await expect(slot(page, slotIndex).locator(`[data-card-id="${id}"]`)).toBeVisible();
}

/** Drag with real pointer events so dnd-kit's sensor sees a drag. */
export async function drag(page: Page, from: Locator, to: Locator) {
  const a = (await from.boundingBox())!;
  const b = (await to.boundingBox())!;
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2 + 10, { steps: 3 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
  await page.mouse.up();
}

/** Words on a card in top/right/bottom/left order, read from the DOM. */
export async function cardWords(locator: Locator) {
  return locator.evaluate((node) => {
    const word = (edge: string) => node.querySelector(`[data-edge="${edge}"]`)?.textContent;
    return { top: word("top"), right: word("right"), bottom: word("bottom"), left: word("left") };
  });
}

/**
 * Geometry checks for the solving screen: nothing scrolls, nothing leaves the
 * viewport, card words stay inside their cards without touching each other
 * or the rotate buttons, and clue labels don't collide with cards.
 */
export async function layoutProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const problems: string[] = [];
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const doc = document.documentElement;
    if (doc.scrollWidth > vw + 1) problems.push(`horizontal scroll: ${doc.scrollWidth} > ${vw}`);
    if (doc.scrollHeight > vh + 1) problems.push(`vertical scroll: ${doc.scrollHeight} > ${vh}`);

    const visible = (el: Element) => (el as HTMLElement).offsetParent !== null || getComputedStyle(el).position === "fixed";
    const rect = (el: Element) => el.getBoundingClientRect();
    const overlaps = (a: DOMRect, b: DOMRect, pad = 0) =>
      a.left < b.right - pad && b.left < a.right - pad && a.top < b.bottom - pad && b.top < a.bottom - pad;
    const inside = (inner: DOMRect, outer: DOMRect) =>
      inner.left >= outer.left - 0.5 && inner.right <= outer.right + 0.5 && inner.top >= outer.top - 0.5 && inner.bottom <= outer.bottom + 0.5;

    const cards = [...document.querySelectorAll(".word-card")].filter(visible).filter((el) => el.querySelector("[data-edge]"));
    for (const cardEl of cards) {
      const box = rect(cardEl);
      const words = [...cardEl.querySelectorAll("[data-edge]")].map((el) => ({ el, r: rect(el), text: el.textContent }));
      const icon = cardEl.querySelector(".rotate-button > span");
      for (const w of words) {
        if (!inside(w.r, box)) problems.push(`word ${w.text} spills out of its card`);
        if (icon && overlaps(w.r, rect(icon))) problems.push(`word ${w.text} touches the rotate button`);
      }
      for (let i = 0; i < words.length; i++) {
        for (let j = i + 1; j < words.length; j++) {
          if (overlaps(words[i].r, words[j].r)) problems.push(`words ${words[i].text} and ${words[j].text} overlap`);
        }
      }
    }

    const clues = [...document.querySelectorAll(".clue")].filter(visible);
    for (const clue of clues) {
      const r = rect(clue);
      const text = clue.textContent?.slice(0, 20);
      if (r.left < 0 || r.right > vw || r.top < 0 || r.bottom > vh) problems.push(`clue "${text}" is off screen`);
      const textEl = clue.querySelector(".clue-text");
      if (textEl && !inside(rect(textEl), r)) problems.push(`clue "${text}" text overflows its label`);
      for (const other of clues) {
        if (other !== clue && overlaps(r, rect(other))) problems.push(`clue "${text}" overlaps another clue`);
      }
      for (const cardEl of cards) {
        if (overlaps(r, rect(cardEl), 1)) problems.push(`clue "${text}" overlaps a card`);
      }
    }

    for (const button of [...document.querySelectorAll("main button, main a")].filter(visible)) {
      const r = rect(button);
      if (r.width === 0) continue;
      if (r.left < 0 || r.right > vw + 0.5 || r.top < 0 || r.bottom > vh + 0.5) {
        problems.push(`control "${button.textContent || button.getAttribute("aria-label")}" is off screen`);
      }
    }
    return problems;
  });
}
