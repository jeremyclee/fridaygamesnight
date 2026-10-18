import { isRotation } from "@/games/clover/lib/card-rotation";
import {
  SLOTS,
  type Arrangement,
  type Placements,
  type PublicPuzzle,
  type Rotation,
  type Solution,
} from "@/games/clover/types";

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
 * Locked slots (confirmed by a check) never change: their cards can't move
 * and nothing can be dropped on them.
 *
 * The tray is derived (every card not in a slot), so a card can never be in two places.
 */
export function moveCard(
  slots: Arrangement["slots"],
  cardId: string,
  target: Location,
  locked: boolean[] = [],
): Arrangement["slots"] {
  const from = locateCard(slots, cardId);
  if ((from.kind === "slot" && locked[from.index]) || (target.kind === "slot" && locked[target.index])) return slots;
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

export function isBoardFull(arrangement: Arrangement): boolean {
  return arrangement.slots.every((id) => id !== null);
}

export function placementsOf(arrangement: Arrangement): Placements {
  return arrangement.slots.map((cardId) => (cardId ? { cardId, rotation: arrangement.rotations[cardId] } : null));
}

/** For each slot, whether it holds the solution's card at the solution's rotation. */
export function correctSlots(solution: Solution, placements: Placements): boolean[] {
  return SLOTS.map((slot, index) => {
    const placed = placements[index];
    return placed?.cardId === solution[slot].cardId && placed.rotation === solution[slot].rotation;
  });
}

/**
 * The second try: right cards stay and lock; the rest go back to the tray
 * with their rotation reset.
 */
export function applyCheck(arrangement: Arrangement, correct: boolean[]): Arrangement {
  const locked = arrangement.slots.map((cardId, index) => cardId !== null && correct[index] === true);
  const slots = arrangement.slots.map((cardId, index) => (locked[index] ? cardId : null));
  const rotations = Object.fromEntries(
    Object.entries(arrangement.rotations).map(([cardId, rotation]) => [cardId, slots.includes(cardId) ? rotation : 0]),
  ) as Arrangement["rotations"];
  return { slots, rotations, locked };
}

/** Reset clears the board, except cards a check has already confirmed. */
export function resetArrangement(arrangement: Arrangement, puzzle: PublicPuzzle): Arrangement {
  return arrangement.locked ? applyCheck(arrangement, arrangement.locked) : emptyArrangement(puzzle);
}

/** Whether Reset would change anything. */
export function canReset(arrangement: Arrangement, puzzle: PublicPuzzle): boolean {
  const reset = resetArrangement(arrangement, puzzle);
  return (
    reset.slots.some((cardId, index) => cardId !== arrangement.slots[index]) ||
    Object.entries(reset.rotations).some(([cardId, rotation]) => arrangement.rotations[cardId] !== rotation)
  );
}

/** Check stored or unexpected state before trusting it. */
export function isValidArrangement(value: unknown, puzzle: PublicPuzzle): value is Arrangement {
  if (typeof value !== "object" || value === null) return false;
  const { slots, rotations, locked } = value as Partial<Arrangement>;
  const ids = puzzle.cards.map((card) => card.id);

  if (!Array.isArray(slots) || slots.length !== SLOTS.length) return false;
  const placed = slots.filter((id) => id !== null);
  if (!placed.every((id) => typeof id === "string" && ids.includes(id))) return false;
  if (new Set(placed).size !== placed.length) return false;

  if (locked !== undefined) {
    if (!Array.isArray(locked) || locked.length !== SLOTS.length) return false;
    if (!locked.every((value, index) => typeof value === "boolean" && (!value || slots[index] !== null))) return false;
  }

  if (typeof rotations !== "object" || rotations === null) return false;
  return (
    Object.keys(rotations).length === ids.length &&
    ids.every((id) => isRotation((rotations as Record<string, unknown>)[id]))
  );
}
