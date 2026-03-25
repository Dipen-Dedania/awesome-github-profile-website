/**
 * Cache-only GitHub stats client.
 *
 * The browser never calls GitHub directly. It reads from:
 * - localStorage for fast local hydration
 * - Firebase Realtime Database as the shared source of truth
 *
 * Fresh GitHub data is written by a separate Node sync job.
 */

import { fetchGitHubCacheSnapshot, isFirebaseCacheEnabled } from './firebaseCache.js';

const LOCAL_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function repoStorageKey(owner, repo) {
  return `gh_repo_${owner.toLowerCase()}_${repo.toLowerCase()}`;
}

function userStorageKey(username) {
  return `gh_user_${username.toLowerCase()}`;
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

function getLocalRecord(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data || !parsed?.fetchedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getFreshLocalData(key) {
  const record = getLocalRecord(key);
  if (!record) return null;
  if (Date.now() - record.fetchedAt > LOCAL_TTL_MS) return null;
  return record.data;
}

function setLocalRecord(key, data, fetchedAt = Date.now()) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, fetchedAt }));
  } catch {
    // Ignore storage quota errors.
  }
}

function hydrateFromSnapshot(profiles, remoteSnapshot, onRepoStat, onUserStat) {
  const remoteRepos = remoteSnapshot?.repos || {};
  const remoteUsers = remoteSnapshot?.users || {};

  const repoRequests = [];
  const seenRepoKeys = new Set();
  for (const profile of profiles) {
    if (!profile.repoUrl) continue;
    try {
      const u = new URL(profile.repoUrl);
      const parts = u.pathname.split('/').filter(Boolean);
      if (parts.length < 2) continue;
      const owner = parts[0];
      const repo = parts[1];
      const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
      if (seenRepoKeys.has(key)) continue;
      seenRepoKeys.add(key);
      repoRequests.push({ owner, repo, key });
    } catch {
      // Ignore invalid URLs.
    }
  }

  const userRequests = [];
  const seenUsers = new Set();
  for (const profile of profiles) {
    if (!profile.author) continue;
    const username = profile.author.trim();
    if (!username) continue;
    const key = username.toLowerCase();
    if (seenUsers.has(key)) continue;
    seenUsers.add(key);
    userRequests.push({ username, key });
  }

  for (const req of repoRequests) {
    const localKey = repoStorageKey(req.owner, req.repo);
    const localRecord = getLocalRecord(localKey);
    if (localRecord?.data) {
      onRepoStat?.(req.key, localRecord.data);
      continue;
    }

    const remoteRecord = remoteRepos[repoFirebaseKey(req.owner, req.repo)] || null;
    if (remoteRecord?.data) {
      onRepoStat?.(req.key, remoteRecord.data);
      setLocalRecord(localKey, remoteRecord.data, remoteRecord.fetchedAt || Date.now());
    }
  }

  for (const req of userRequests) {
    const localKey = userStorageKey(req.username);
    const localRecord = getLocalRecord(localKey);
    if (localRecord?.data) {
      onUserStat?.(req.key, localRecord.data);
      continue;
    }

    const remoteRecord = remoteUsers[userFirebaseKey(req.username)] || null;
    if (remoteRecord?.data) {
      onUserStat?.(req.key, remoteRecord.data);
      setLocalRecord(localKey, remoteRecord.data, remoteRecord.fetchedAt || Date.now());
    }
  }
}

function summarizeSnapshot(remoteSnapshot) {
  const repos = remoteSnapshot?.repos || {};
  const users = remoteSnapshot?.users || {};
  return {
    repoCount: Object.keys(repos).length,
    userCount: Object.keys(users).length,
    totalCount: Object.keys(repos).length + Object.keys(users).length,
    syncedAt: remoteSnapshot?.syncedAt || null,
  };
}

export async function fetchRepoStats(owner, repo) {
  const key = repoStorageKey(owner, repo);
  const cached = getFreshLocalData(key);
  if (cached) return cached;

  const remoteSnapshot = isFirebaseCacheEnabled()
    ? await fetchGitHubCacheSnapshot()
    : null;
  const remoteRecord = remoteSnapshot?.repos?.[repoFirebaseKey(owner, repo)] || null;
  if (remoteRecord?.data) {
    setLocalRecord(key, remoteRecord.data, remoteRecord.fetchedAt || Date.now());
    return remoteRecord.data;
  }

  return null;
}

export async function fetchUserStats(username) {
  const key = userStorageKey(username);
  const cached = getFreshLocalData(key);
  if (cached) return cached;

  const remoteSnapshot = isFirebaseCacheEnabled()
    ? await fetchGitHubCacheSnapshot()
    : null;
  const remoteRecord = remoteSnapshot?.users?.[userFirebaseKey(username)] || null;
  if (remoteRecord?.data) {
    setLocalRecord(key, remoteRecord.data, remoteRecord.fetchedAt || Date.now());
    return remoteRecord.data;
  }

  return null;
}

export async function hydrateProfileStats(
  profiles,
  { onRepoStat, onUserStat } = {},
) {
  const remoteSnapshot = isFirebaseCacheEnabled()
    ? await fetchGitHubCacheSnapshot()
    : null;

  if (import.meta.env.DEV && isFirebaseCacheEnabled()) {
    console.info('[github-cache] Firebase snapshot loaded');
  }

  hydrateFromSnapshot(profiles, remoteSnapshot, onRepoStat, onUserStat);
  return summarizeSnapshot(remoteSnapshot);
}
