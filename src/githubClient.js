/**
 * githubClient.js
 *
 * Thin wrapper around GitHub REST API with localStorage caching.
 * Unauthenticated rate limit is ~60 requests/hour, so we cache aggressively.
 */

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getCache(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function setCache(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch {
    /* storage full — silently ignore */
  }
}

export async function fetchRepoStats(owner, repo) {
  const key = `gh_repo_${owner}_${repo}`;
  const cached = getCache(key);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!res.ok) return null;
    const json = await res.json();
    const data = {
      stars: json.stargazers_count,
      forks: json.forks_count,
      language: json.language,
      updatedAt: json.updated_at,
      openIssues: json.open_issues_count,
      description: json.description,
    };
    setCache(key, data);
    return data;
  } catch {
    return null;
  }
}

export async function fetchUserStats(username) {
  const key = `gh_user_${username}`;
  const cached = getCache(key);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.github.com/users/${username}`);
    if (!res.ok) return null;
    const json = await res.json();
    const data = {
      avatarUrl: json.avatar_url,
      name: json.name,
      login: json.login,
      followers: json.followers,
      htmlUrl: json.html_url,
    };
    setCache(key, data);
    return data;
  } catch {
    return null;
  }
}
