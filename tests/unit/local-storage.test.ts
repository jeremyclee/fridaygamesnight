import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearDraft,
  loadDraft,
  loadProgress,
  loadRecent,
  clearJustCreated,
  isJustCreated,
  markJustCreated,
  MAX_RECENT,
  recordRecent,
  saveDraft,
  saveProgress,
} from "@/lib/local-storage";
import { emptyArrangement, moveCard, slotLocation } from "@/lib/placement";
import { generateBoard } from "@/lib/puzzle-generator";
import type { PublicPuzzle } from "@/types/puzzle";

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

const clues = { top: "a", right: "b", bottom: "c", left: "d" };
const puzzle: PublicPuzzle = {
  clues,
  cards: ["c0", "c1", "c2", "c3", "c4"].map((id, i) => ({
    id,
    words: { top: `T${i}`, right: `R${i}`, bottom: `B${i}`, left: `L${i}` },
  })),
};

let local: Storage;

beforeEach(() => {
  local = memoryStorage();
  vi.stubGlobal("window", { localStorage: local, sessionStorage: memoryStorage() });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("drafts", () => {
  it("saves, loads and clears the current draft", () => {
    const draft = { board: generateBoard(), clues };
    saveDraft(draft);
    expect(loadDraft()).toEqual(draft);
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it("ignores corrupt or outdated drafts", () => {
    local.setItem("clover:draft:v1", "{not json");
    expect(loadDraft()).toBeNull();
    local.setItem("clover:draft:v1", JSON.stringify({ board: { cards: [], rotations: [] }, clues }));
    expect(loadDraft()).toBeNull();
    const board = generateBoard();
    board.cards[0].words.top = "NOTAWORD";
    local.setItem("clover:draft:v1", JSON.stringify({ board, clues }));
    expect(loadDraft()).toBeNull();
  });
});

describe("progress", () => {
  it("keeps progress separately for each puzzle", () => {
    const a = emptyArrangement(puzzle);
    a.slots = moveCard(a.slots, "c3", slotLocation(2));
    a.rotations.c3 = 2;
    saveProgress("puzzle-a", a);

    expect(loadProgress("puzzle-a", puzzle)).toEqual(a);
    expect(loadProgress("puzzle-b", puzzle)).toBeNull();
  });

  it("ignores progress that doesn't match the puzzle", () => {
    local.setItem("clover:progress:x:v1", JSON.stringify({ slots: ["zz", null, null, null], rotations: {} }));
    expect(loadProgress("x", puzzle)).toBeNull();
    local.setItem("clover:progress:x:v1", "]]]");
    expect(loadProgress("x", puzzle)).toBeNull();
  });
});

describe("recent puzzles", () => {
  it("records puzzles newest first without duplicates", () => {
    recordRecent({ code: "one", label: "AAAA", clues, created: true }, 1);
    recordRecent({ code: "two", label: "BBBB", clues }, 2);
    recordRecent({ code: "one", label: "AAAA", clues }, 3);

    const recent = loadRecent();
    expect(recent.map((r) => r.code)).toEqual(["one", "two"]);
    expect(recent[0]).toMatchObject({ createdAt: 1, lastOpenedAt: 3 });
    expect(recent[1].createdAt).toBeUndefined();
  });

  it(`keeps at most ${MAX_RECENT}`, () => {
    for (let i = 0; i < MAX_RECENT + 10; i++) recordRecent({ code: `p${i}`, label: "AAAA", clues }, i);
    expect(loadRecent()).toHaveLength(MAX_RECENT);
    expect(loadRecent()[0].code).toBe(`p${MAX_RECENT + 9}`);
  });

  it("drops malformed entries", () => {
    local.setItem("clover:recent:v1", JSON.stringify([{ code: 1 }, null, { code: "ok", label: "X", clues, lastOpenedAt: 1 }]));
    expect(loadRecent().map((r) => r.code)).toEqual(["ok"]);
  });
});

describe("without storage", () => {
  it("does nothing on the server", () => {
    vi.unstubAllGlobals();
    expect(loadDraft()).toBeNull();
    expect(loadRecent()).toEqual([]);
    expect(saveDraft({ board: generateBoard(), clues })).toBe(false);
  });
});

describe("just-created flag", () => {
  it("matches only the puzzle that was just published", () => {
    markJustCreated("k");
    expect(isJustCreated("other")).toBe(false);
    expect(isJustCreated("k")).toBe(true);
    clearJustCreated();
    expect(isJustCreated("k")).toBe(false);
  });
});
