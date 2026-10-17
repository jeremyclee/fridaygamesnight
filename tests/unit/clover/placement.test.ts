import { describe, expect, it } from "vitest";
import {
  emptyArrangement,
  isValidArrangement,
  locateCard,
  moveCard,
  slotLocation,
  TRAY,
  trayCardIds,
} from "@/games/clover/lib/placement";
import type { Arrangement, PublicPuzzle } from "@/games/clover/types";

const puzzle: PublicPuzzle = {
  clues: { top: "a", right: "b", bottom: "c", left: "d" },
  cards: ["c0", "c1", "c2", "c3", "c4"].map((id, i) => ({
    id,
    words: { top: `T${i}`, right: `R${i}`, bottom: `B${i}`, left: `L${i}` },
  })),
};

const empty = (): Arrangement["slots"] => [null, null, null, null];

function expectAllCardsAccountedFor(slots: Arrangement["slots"]) {
  const placed = slots.filter((id): id is string => id !== null);
  const tray = trayCardIds(puzzle, slots);
  expect(new Set(placed).size).toBe(placed.length);
  expect([...placed, ...tray].sort()).toEqual(["c0", "c1", "c2", "c3", "c4"]);
}

describe("moveCard", () => {
  it("moves a card from the tray to an empty slot", () => {
    const slots = moveCard(empty(), "c2", slotLocation(1));
    expect(slots).toEqual([null, "c2", null, null]);
    expect(trayCardIds(puzzle, slots)).toEqual(["c0", "c1", "c3", "c4"]);
    expectAllCardsAccountedFor(slots);
  });

  it("moves a placed card to an empty slot", () => {
    const slots = moveCard([null, "c2", null, null], "c2", slotLocation(3));
    expect(slots).toEqual([null, null, null, "c2"]);
    expectAllCardsAccountedFor(slots);
  });

  it("swaps two placed cards", () => {
    const slots = moveCard(["c0", "c1", null, null], "c0", slotLocation(1));
    expect(slots).toEqual(["c1", "c0", null, null]);
    expectAllCardsAccountedFor(slots);
  });

  it("returns the occupant to the tray when a tray card replaces it", () => {
    const slots = moveCard(["c0", null, null, null], "c4", slotLocation(0));
    expect(slots).toEqual(["c4", null, null, null]);
    expect(trayCardIds(puzzle, slots)).toContain("c0");
    expectAllCardsAccountedFor(slots);
  });

  it("returns a placed card to the tray", () => {
    const slots = moveCard(["c0", "c1", null, null], "c1", TRAY);
    expect(slots).toEqual(["c0", null, null, null]);
    expect(trayCardIds(puzzle, slots)).toEqual(["c1", "c2", "c3", "c4"]);
  });

  it("ignores dropping a card onto its own slot or a tray card onto the tray", () => {
    const slots: Arrangement["slots"] = ["c0", null, null, null];
    expect(moveCard(slots, "c0", slotLocation(0))).toBe(slots);
    expect(moveCard(slots, "c3", TRAY)).toEqual(slots);
  });

  it("keeps every card in exactly one place through many random moves", () => {
    let slots = empty();
    const ids = puzzle.cards.map((card) => card.id);
    let seed = 7;
    const next = () => (seed = (seed * 16807) % 2147483647);
    for (let i = 0; i < 500; i++) {
      const id = ids[next() % ids.length];
      const target = next() % 5;
      slots = moveCard(slots, id, target === 4 ? TRAY : slotLocation(target));
      expectAllCardsAccountedFor(slots);
    }
  });
});

describe("locateCard", () => {
  it("finds cards in slots and the tray", () => {
    expect(locateCard([null, "c3", null, null], "c3")).toEqual(slotLocation(1));
    expect(locateCard([null, "c3", null, null], "c1")).toEqual(TRAY);
  });
});

describe("isValidArrangement", () => {
  it("accepts a fresh arrangement", () => {
    expect(isValidArrangement(emptyArrangement(puzzle), puzzle)).toBe(true);
  });

  it("rejects corrupt or mismatched state", () => {
    const good = emptyArrangement(puzzle);
    expect(isValidArrangement(null, puzzle)).toBe(false);
    expect(isValidArrangement("nope", puzzle)).toBe(false);
    expect(isValidArrangement({ ...good, slots: ["c0", "c0", null, null] }, puzzle)).toBe(false);
    expect(isValidArrangement({ ...good, slots: ["zz", null, null, null] }, puzzle)).toBe(false);
    expect(isValidArrangement({ ...good, slots: [null, null, null] }, puzzle)).toBe(false);
    expect(isValidArrangement({ ...good, rotations: { ...good.rotations, c0: 5 } }, puzzle)).toBe(false);
    expect(isValidArrangement({ ...good, rotations: { c0: 0 } }, puzzle)).toBe(false);
  });
});
