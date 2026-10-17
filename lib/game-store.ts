import "server-only";
import { readFileSync } from "node:fs";
import { doc, getDoc, runTransaction, serverTimestamp } from "firebase/firestore/lite";
import { firebaseConfigured, firestore } from "@/lib/firebase";

/**
 * Each game owns one top-level Firestore collection, named after the game
 * (e.g. "clover"). Documents are only ever created and read.
 *
 * Without Firebase credentials, development uses an in-memory store instead,
 * so the site runs before Firebase is set up. Production refuses to start
 * without credentials unless DATA_STORE=memory is set explicitly (tests).
 */
export interface GameCollection {
  /** Create a document. Resolves false if the id is already taken. */
  create(id: string, data: Record<string, unknown>): Promise<boolean>;
  get(id: string): Promise<Record<string, unknown> | null>;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Firebase isn't configured. Set FIREBASE_API_KEY and FIREBASE_PROJECT_ID.");
  }
}

export function gameCollection(game: string): GameCollection {
  return shouldUseMemoryStore() ? memoryCollection(game) : firestoreCollection(game);
}

function shouldUseMemoryStore(): boolean {
  if (process.env.DATA_STORE === "memory") return true;
  if (firebaseConfigured()) return false;
  if (process.env.NODE_ENV === "production") throw new StorageNotConfiguredError();
  warnOnce("Firebase isn't configured; using an in-memory store. Puzzles disappear when the server restarts.");
  return true;
}

// Firestore ------------------------------------------------------------------

function firestoreCollection(game: string): GameCollection {
  const db = firestore();
  return {
    // A transaction so an existing document is never overwritten.
    create: (id, data) =>
      runTransaction(db, async (transaction) => {
        const ref = doc(db, game, id);
        if ((await transaction.get(ref)).exists()) return false;
        transaction.set(ref, { ...data, createdAt: serverTimestamp() });
        return true;
      }),
    async get(id) {
      const snapshot = await getDoc(doc(db, game, id));
      return snapshot.exists() ? snapshot.data() : null;
    },
  };
}

// In memory --------------------------------------------------------------------

type MemoryDb = Map<string, Map<string, Record<string, unknown>>>;

// Kept on globalThis so every server module instance shares one store.
const shared = globalThis as typeof globalThis & { __gameStore?: MemoryDb; __gameStoreWarned?: boolean };

function memoryDb(): MemoryDb {
  if (!shared.__gameStore) {
    const db: MemoryDb = new Map();
    // Optional fixtures: { "<game>": { "<id>": { ...document } } }
    const seedPath = process.env.DATA_STORE_SEED;
    if (seedPath) {
      const seed = JSON.parse(readFileSync(seedPath, "utf8")) as Record<string, Record<string, Record<string, unknown>>>;
      for (const [game, docs] of Object.entries(seed)) db.set(game, new Map(Object.entries(docs)));
    }
    shared.__gameStore = db;
  }
  return shared.__gameStore;
}

function memoryCollection(game: string): GameCollection {
  const db = memoryDb();
  if (!db.has(game)) db.set(game, new Map());
  const docs = db.get(game)!;
  return {
    async create(id, data) {
      if (docs.has(id)) return false;
      docs.set(id, structuredClone({ ...data, createdAt: new Date() }));
      return true;
    },
    async get(id) {
      const doc = docs.get(id);
      return doc ? structuredClone(doc) : null;
    },
  };
}

function warnOnce(message: string) {
  if (shared.__gameStoreWarned) return;
  shared.__gameStoreWarned = true;
  console.warn(message);
}
