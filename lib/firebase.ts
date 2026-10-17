import "server-only";
import { getApps, initializeApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore/lite";

/**
 * Firestore via the regular Firebase web SDK, using the project's public web
 * config (no service account). Access is controlled by firestore.rules, which
 * allow anonymous reads and creates. Only the site's server uses it, so the
 * rest of the code can validate requests before anything is written.
 */
export function firebaseConfigured(): boolean {
  return Boolean(process.env.FIREBASE_API_KEY && process.env.FIREBASE_PROJECT_ID);
}

export function firestore(): Firestore {
  const app =
    getApps()[0] ??
    initializeApp({ apiKey: process.env.FIREBASE_API_KEY, projectId: process.env.FIREBASE_PROJECT_ID });
  return getFirestore(app);
}
