import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const DATA_PATH = join(ROOT, 'data.md');
const SYNC_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ENV_PATH = join(ROOT, '.env');

function loadEnvFile() {
  try {
    const content = readFileSync(ENV_PATH, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
      if (!match) continue;
      const key = match[1];
      if (process.env[key] != null) continue;
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch {
    // Missing .env is fine; the workflow injects env vars directly.
  }
}

loadEnvFile();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const githubToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

function hasRequiredFirebaseConfig(cfg) {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId && cfg.databaseURL);
}

function firebaseSafeKey(raw) {
  return String(raw).replace(/[.#$[\]/]/g, '_').toLowerCase();
}

function repoFirebaseKey(owner, repo) {
  return firebaseSafeKey(`${owner}_${repo}`);
}

function userFirebaseKey(username) {
  return firebaseSafeKey(username);
}

function extractProfileBlock(text) {
  const startMarker = '<!-- PROFILES-START -->';
  const endMarker = '<!-- PROFILES-END -->';
  const startIdx = text.indexOf(startMarker);
  const endIdx = text.indexOf(endMarker);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    throw new Error('Could not find profile markers in data.md');
  }
  return text.slice(startIdx + startMarker.length, endIdx).trim();
}

function parseEntries(block) {
  const rawEntries = block.split('---').map((s) => s.trim()).filter(Boolean);
  const profiles = [];

  for (const entry of rawEntries) {
    const lines = entry.split('\n').map((line) => line.trim()).filter(Boolean);
    let repoUrl = null;
    let siteUrl = null;

    for (const line of lines) {
      if (line.startsWith('Repo -') || line.startsWith('Repo-')) {
        repoUrl = line.replace(/^Repo\s*-\s*/, '').trim();
      } else if (line.startsWith('Link -') || line.startsWith('Link-')) {
        siteUrl = line.replace(/^Link\s*-\s*/, '').trim();
      } else if (line.startsWith('Code -') || line.startsWith('Code-')) {
        repoUrl = line.replace(/^Code\s*-\s*/, '').trim();
      }
    }

    if (!repoUrl) continue;

    try {
      const u = new URL(repoUrl);
      if (u.host.toLowerCase() !== 'github.com') continue;
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length < 2) continue;
      profiles.push({
        owner: parts[0],
        repo: parts[1].replace(/\.git$/i, ''),
        repoUrl,
        siteUrl,
      });
    } catch {
      // Ignore invalid entries.
    }
  }

  return profiles;
}

function createFirebaseDb() {
  if (!hasRequiredFirebaseConfig(firebaseConfig)) {
    throw new Error(
      'Missing Firebase config. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID, and VITE_FIREBASE_APP_ID.',
    );
  }

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getDatabase(app);
}

function requireGitHubToken() {
  if (!githubToken) {
    throw new Error(
      'Missing GitHub token. Set GITHUB_TOKEN locally or let the GitHub Actions workflow provide github.token.',
    );
  }
}

async function fetchJson(url) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`GitHub request failed ${res.status}: ${url}\n${body}`);
    err.status = res.status;
    err.url = url;
    err.body = body;
    throw err;
  }

  return res.json();
}

async function fetchRepoStats(owner, repo) {
  const json = await fetchJson(`https://api.github.com/repos/${owner}/${repo}`);
  return {
    stars: json.stargazers_count,
    forks: json.forks_count,
    language: json.language,
    updatedAt: json.updated_at,
    openIssues: json.open_issues_count,
    description: json.description,
  };
}

async function fetchUserStats(username) {
  const json = await fetchJson(`https://api.github.com/users/${username}`);
  return {
    avatarUrl: json.avatar_url,
    name: json.name,
    login: json.login,
    followers: json.followers,
    htmlUrl: json.html_url,
  };
}

function isStale(fetchedAt) {
  if (!fetchedAt) return true;
  return Date.now() - fetchedAt > SYNC_TTL_MS;
}

async function main() {
  requireGitHubToken();
  const db = createFirebaseDb();
  const markdown = readFileSync(DATA_PATH, 'utf-8');
  const block = extractProfileBlock(markdown);
  const profiles = parseEntries(block);

  const snapshot = await get(ref(db, 'githubCache'));
  const current = snapshot.exists() ? snapshot.val() : {};
  const currentRepos = current.repos || {};
  const currentUsers = current.users || {};

  const repoTargets = [];
  const seenRepoKeys = new Set();
  for (const profile of profiles) {
    const key = `${profile.owner.toLowerCase()}/${profile.repo.toLowerCase()}`;
    if (seenRepoKeys.has(key)) continue;
    seenRepoKeys.add(key);
    const firebaseKey = repoFirebaseKey(profile.owner, profile.repo);
    const existing = currentRepos[firebaseKey];
    if (existing && !isStale(existing.fetchedAt)) continue;
    repoTargets.push({ ...profile, key, firebaseKey });
  }

  const userTargets = [];
  const seenUsers = new Set();
  for (const profile of profiles) {
    const username = profile.owner.trim();
    const key = username.toLowerCase();
    if (seenUsers.has(key)) continue;
    seenUsers.add(key);
    const firebaseKey = userFirebaseKey(username);
    const existing = currentUsers[firebaseKey];
    if (existing && !isStale(existing.fetchedAt)) continue;
    userTargets.push({ username, key, firebaseKey });
  }

  console.log(`Profiles: ${profiles.length}`);
  console.log(`Repos to refresh: ${repoTargets.length}`);
  console.log(`Users to refresh: ${userTargets.length}`);

  const patch = {
    'githubCache/syncedAt': Date.now(),
  };
  let repoSuccess = 0;
  let repoFail = 0;
  let userSuccess = 0;
  let userFail = 0;

  for (const target of repoTargets) {
    console.log(`Repo -> ${target.owner}/${target.repo}`);
    try {
      const data = await fetchRepoStats(target.owner, target.repo);
      patch[`githubCache/repos/${target.firebaseKey}`] = {
        data,
        fetchedAt: Date.now(),
      };
      repoSuccess += 1;
    } catch (error) {
      repoFail += 1;
      patch[`githubCache/repos/${target.firebaseKey}`] = {
        data: null,
        fetchedAt: Date.now(),
        error: {
          status: error.status || 0,
          message: error.message,
        },
      };
      console.warn(`Repo failed (${target.owner}/${target.repo}): ${error.message}`);
    }
  }

  for (const target of userTargets) {
    console.log(`User -> ${target.username}`);
    try {
      const data = await fetchUserStats(target.username);
      patch[`githubCache/users/${target.firebaseKey}`] = {
        data,
        fetchedAt: Date.now(),
      };
      userSuccess += 1;
    } catch (error) {
      userFail += 1;
      patch[`githubCache/users/${target.firebaseKey}`] = {
        data: null,
        fetchedAt: Date.now(),
        error: {
          status: error.status || 0,
          message: error.message,
        },
      };
      console.warn(`User failed (${target.username}): ${error.message}`);
    }
  }

  if (Object.keys(patch).length === 1) {
    console.log('Nothing stale to sync.');
    return;
  }

  await update(ref(db), patch);
  console.log('Firebase cache updated.');
  console.log(`Repo success: ${repoSuccess}, Repo fail: ${repoFail}`);
  console.log(`User success: ${userSuccess}, User fail: ${userFail}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
