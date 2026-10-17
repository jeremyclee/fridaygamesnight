import { isRotation } from "@/games/clover/lib/card-rotation";
import { SLOTS, type Arrangement, type PublicPuzzle, type Rotation } from "@/games/clover/types";

export type Location = { kind: "slot"; index: number } | { kind: "tray" };

export const TRAY: Location = { kind: "tray" };

export function slotLocation(index: number): Location {
  return { kind: "slot", index };
}

export function emptyArrangement(puzzle: PublicPuzzle): Arrangement {
  return {
    slots: SLOTS.map(() => null),
    rotations: Object.fromEntries(puzzle.cards.map((card) => [card.id, 0 as Rotation])),
  };
}

export function locateCard(slots: Arrangement["slots"], cardId: string): Location {
  const index = slots.indexOf(cardId);
  return index === -1 ? TRAY : slotLocation(index);
}

/**
 * Move a card to a slot or back to the tray.
 *
 * - Into an empty slot: the card moves there.
 * - Onto another placed card: the two swap.
 * - From the tray onto an occupied slot: the occupant returns to the tray.
 *
 * The tray is derived (every card not in a slot), so a card can never be in two places.
 */
export function moveCard(
  slots: Arrangement["slots"],
  cardId: string,
  target: Location,
): Arrangement["slots"] {
  const from = locateCard(slots, cardId);
  const next = [...slots];

  if (target.kind === "tray") {
    if (from.kind === "slot") next[from.index] = null;
    return next;
  }

  if (from.kind === "slot") {
    if (from.index === target.index) return slots;
    next[from.index] = next[target.index];
  }
  next[target.index] = cardId;
  return next;
}

/** Unplaced cards, in their original tray order. */
export function trayCardIds(puzzle: PublicPuzzle, slots: Arrangement["slots"]): string[] {
  return puzzle.cards.map((card) => card.id).filter((id) => !slots.includes(id));
}

export function isEmptyArrangement(arrangement: Arrangement): boolean {
  return (
    arrangement.slots.every((id) => id === null) &&
    Object.values(arrangement.rotations).every((rotation) => rotation === 0)
  );
}

/** Check stored or unexpected state before trusting it. */
export function isValidArrangement(value: unknown, puzzle: PublicPuzzle): value is Arrangement {
  if (typeof value !== "object" || value === null) return false;
  const { slots, rotations } = value as Partial<Arrangement>;
  const ids = puzzle.cards.map((card) => card.id);

  if (!Array.isArray(slots) || slots.length !== SLOTS.length) return false;
  const placed = slots.filter((id) => id !== null);
  if (!placed.every((id) => typeof id === "string" && ids.includes(id))) return false;
  if (new Set(placed).size !== placed.length) return false;

  if (typeof rotations !== "object" || rotations === null) return false;
  return (
    Object.keys(rotations).length === ids.length &&
    ids.every((id) => isRotation((rotations as Record<string, unknown>)[id]))
  );
}
