import { describe, expect, it } from "vitest";
import {
  applyCheck,
  canReset,
  correctSlots,
  emptyArrangement,
  isValidArrangement,
  locateCard,
  moveCard,
  placementsOf,
  resetArrangement,
  slotLocation,
  TRAY,
  trayCardIds,
} from "@/games/clover/lib/placement";
import type { Arrangement, PublicPuzzle, Solution } from "@/games/clover/types";

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

describe("checking a board (second try)", () => {
  const solution: Solution = {
    topLeft: { cardId: "c1", rotation: 0 },
    topRight: { cardId: "c4", rotation: 1 },
    bottomLeft: { cardId: "c3", rotation: 0 },
    bottomRight: { cardId: "c2", rotation: 2 },
  };

  // Right card and rotation in TL and BL; right card, wrong rotation in TR; wrong card in BR.
  const guess: Arrangement = {
    slots: ["c1", "c4", "c3", "c0"],
    rotations: { c0: 3, c1: 0, c2: 0, c3: 0, c4: 2 },
  };

  it("needs both the right card and the right rotation", () => {
    expect(correctSlots(solution, placementsOf(guess))).toEqual([true, false, true, false]);
    expect(correctSlots(solution, [null, null, null, null])).toEqual([false, false, false, false]);
  });

  it("keeps right cards locked and returns the rest to the tray unrotated", () => {
    const after = applyCheck(guess, correctSlots(solution, placementsOf(guess)));
    expect(after.slots).toEqual(["c1", null, "c3", null]);
    expect(after.locked).toEqual([true, false, true, false]);
    expect(after.rotations).toEqual({ c0: 0, c1: 0, c2: 0, c3: 0, c4: 0 });
    expect(trayCardIds(puzzle, after.slots)).toEqual(["c0", "c2", "c4"]);
    expect(isValidArrangement(after, puzzle)).toBe(true);
  });

  it("keeps the rotation of locked cards", () => {
    const rotated: Arrangement = { slots: ["c1", null, null, "c2"], rotations: { ...guess.rotations, c2: 2 } };
    const after = applyCheck(rotated, correctSlots(solution, placementsOf(rotated)));
    expect(after.slots).toEqual(["c1", null, null, "c2"]);
    expect(after.rotations.c2).toBe(2);
  });

  it("locks every card when the board is right", () => {
    const right: Arrangement = { slots: ["c1", "c4", "c3", "c2"], rotations: { c0: 0, c1: 0, c2: 2, c3: 0, c4: 1 } };
    expect(applyCheck(right, correctSlots(solution, placementsOf(right))).locked).toEqual([true, true, true, true]);
  });

  it("won't move locked cards or drop onto locked slots", () => {
    const locked = [true, false, false, false];
    const slots: Arrangement["slots"] = ["c1", "c0", null, null];
    expect(moveCard(slots, "c1", TRAY, locked)).toBe(slots);
    expect(moveCard(slots, "c1", slotLocation(2), locked)).toBe(slots);
    expect(moveCard(slots, "c0", slotLocation(0), locked)).toBe(slots);
    expect(moveCard(slots, "c2", slotLocation(0), locked)).toBe(slots);
    expect(moveCard(slots, "c0", slotLocation(3), locked)).toEqual(["c1", null, null, "c0"]);
  });

  it("reset keeps locked cards and clears the rest", () => {
    const checked = applyCheck(guess, [true, false, true, false]);
    const played: Arrangement = {
      ...checked,
      slots: ["c1", "c4", "c3", "c2"],
      rotations: { ...checked.rotations, c4: 1, c2: 3 },
    };
    expect(canReset(played, puzzle)).toBe(true);
    const reset = resetArrangement(played, puzzle);
    expect(reset).toEqual(checked);
    expect(canReset(reset, puzzle)).toBe(false);
  });

  it("reset clears everything before a check", () => {
    expect(resetArrangement(guess, puzzle)).toEqual(emptyArrangement(puzzle));
    expect(canReset(emptyArrangement(puzzle), puzzle)).toBe(false);
  });

  it("rejects stored locks that don't make sense", () => {
    const good = applyCheck(guess, [true, false, true, false]);
    expect(isValidArrangement({ ...good, locked: [true, true, true, true] }, puzzle)).toBe(false);
    expect(isValidArrangement({ ...good, locked: [true] }, puzzle)).toBe(false);
    expect(isValidArrangement({ ...good, locked: "yes" }, puzzle)).toBe(false);
  });
});
