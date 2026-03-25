import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasRequiredConfig(cfg) {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId && cfg.databaseURL);
}

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

let db = null;
if (hasRequiredConfig(firebaseConfig)) {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getDatabase(app);
} else if (import.meta.env.DEV) {
  console.warn(
    '[firebase-cache] Disabled. Missing config keys:',
    missingKeys.join(', '),
  );
}

export function isFirebaseCacheEnabled() {
  return Boolean(db);
}

export function getFirebaseCacheStatus() {
  return {
    enabled: Boolean(db),
    missingKeys,
  };
}

export async function fetchGitHubCacheSnapshot() {
  if (!db) return null;
  try {
    const snap = await get(ref(db, 'githubCache'));
    return snap.exists() ? snap.val() : {};
  } catch (err) {
    console.warn('[firebase-cache] Read failed:', err);
    return null;
  }
}

export async function writeGitHubCachePatch(patch) {
  if (!db) return;
  const keys = Object.keys(patch || {});
  if (keys.length === 0) return;
  try {
    await update(ref(db, 'githubCache'), patch);
  } catch (err) {
    console.warn('[firebase-cache] Write failed:', err);
  }
}
