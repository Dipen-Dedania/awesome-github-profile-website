Goal: Build a small static gallery site for an “Awesome GitHub Websites” list.

## Tech + constraints

- Stack: React + **JavaScript** (no TypeScript) + Vite, Tailwind.
- Data source: an existing **markdown section in `data.md`**, not JSON.
  - The markdown follows a pattern like:

    ```md
    Repo - https://github.com/aedorado/aedorado.github.io
    Link - http://aedorado.github.io/
    ```
- Hosting: GitHub Pages (static build), no backend.
- Use **GitHub REST API** on the client, but:
  - Be aware of unauthenticated rate limits (~60/hour).  
  - Implement simple caching in `localStorage` with an expiration window (e.g. 6–12 hours). [docs.github](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)

## Data ingestion from markdown

Instead of a JSON file, assume the source data lives in `data.md` in a clearly delimited block, e.g.:

```md
<!-- PROFILES-START -->

---
Repo - https://github.com/aedorado/aedorado.github.io

Link - http://aedorado.github.io/
---
Repo - https://github.com/aliu139/aliu139.github.io

Link - http://aliu139.github.io/
---

<!-- PROFILES-END -->
```

Implement a **build-time script** in Node (JavaScript) that:

1. Reads `data.md`.
2. Extracts the text between `<!-- PROFILES-START -->` and `<!-- PROFILES-END -->`.
3. Parses it into an array of profile objects.

Parsing rules:

- For each block of 3 non-empty lines:
  - `Repo - [label](siteUrl)`
  - `Link - siteUrl`
  - `Code - repoUrl`
- Create an object:

  ```js
  {
    id: derived from `label` or `siteUrl` (e.g. slugified),
    name: label,                     // e.g. "mldangelo.com"
    siteUrl: "https://mldangelo.com",
    repoUrl: "https://github.com/mldangelo/personal-site",
    type: "personal" or "template",  // initial classification can be manual or heuristic
    stack: [],                       // optional: leave empty or infer later
    tags: [],                        // optional: leave empty for now
    author: inferred from repoUrl,   // e.g. from "github.com/<author>/<repo>"
    country: null                    // optional
  }
  ```

4. Write the resulting array to a **generated JS module**, e.g. `src/profiles.js`:

   ```js
   export const profiles = [
     {
       id: "mldangelo-com",
       name: "mldangelo.com",
       siteUrl: "https://mldangelo.com",
       repoUrl: "https://github.com/mldangelo/personal-site",
       type: "personal",
       stack: [],
       tags: [],
       author: "mldangelo",
       country: null
     },
     // ...
   ];
   ```

This keeps `data.md` as the single source of truth; the UI imports `profiles` from that module.

## GitHub API usage (JS)

For each `repoUrl`:

- Call `GET https://api.github.com/repos/{owner}/{repo}` to get:
  - `stargazers_count`, `forks_count`, `language`, `updated_at`, `open_issues_count`. [docs.github](https://docs.github.com/en/enterprise-server@3.20/rest/repos/forks)

For each `author`:

- Call `GET https://api.github.com/users/{author}` to get:
  - `avatar_url`, `name`, `login`, `followers`, `html_url`. [docs.github](https://docs.github.com/en/rest/users/users)

Implement a small `githubClient.js`:

```js
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
  } catch {}
}

export async function fetchRepoStats(owner, repo) {
  const key = `gh_repo_${owner}_${repo}`;
  const cached = getCache(key);
  if (cached) return cached;

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  const json = await res.json();
  const data = {
    stars: json.stargazers_count,
    forks: json.forks_count,
    language: json.language,
    updatedAt: json.updated_at,
    openIssues: json.open_issues_count
  };
  setCache(key, data);
  return data;
}

export async function fetchUserStats(username) {
  const key = `gh_user_${username}`;
  const cached = getCache(key);
  if (cached) return cached;

  const res = await fetch(`https://api.github.com/users/${username}`);
  const json = await res.json();
  const data = {
    avatarUrl: json.avatar_url,
    name: json.name,
    login: json.login,
    followers: json.followers,
    htmlUrl: json.html_url
  };
  setCache(key, data);
  return data;
}
```

## UI layout (React + JS)

Global layout:

- Top bar:
  - Title: “Awesome GitHub Websites”.
  - Subtitle: “Curated gallery of GitHub-hosted profile sites & templates”.
- Controls row:
  - Search input (filter by `name`, `author`, `tags`, `stack`).
  - Filter by `type`: All / Personal / Template.
  - Filter by `stack` (derived dynamically from `profiles`).
  - Sort: Name A–Z, Most starred, Recently updated.

Stats bar:

- Compute from `profiles` + fetched stats (when available):
  - Total profiles.
  - Count per type.
  - Total stars.
  - Top language by frequency.

Gallery:

- Use CSS Grid (or Tailwind’s `grid` utilities) for a **card gallery**.
- `ProfileCard` component props:
  - `profile` (from `profiles.js`).
  - `repoStats` (stars, forks, language, updatedAt).
  - `userStats` (avatar, followers).
- Card content:
  - Clickable title → `siteUrl`.
  - Author label (`@author`), type badge.
  - Stack/tags badges.
  - GitHub stats row: ⭐ stars, 🍴 forks, language, “Updated X days ago”.
  - Avatar in corner, followers in tooltip or small text.
  - Buttons: “View site”, “View code”.

“Trending” badge:

- Add if `stars` > threshold and `updatedAt` within last 90 days.
- Visual: small 🔥 badge at card top.

## Behavior

- On initial render:
  - Import `profiles` from `src/profiles.js`.
  - Render cards with static info.
  - In a `useEffect`, loop over visible profiles and call `fetchRepoStats` and `fetchUserStats` to hydrate cards.
- Debounce search input.
- All filtering/sorting is client-side.

## Scripts / structure

- `scripts/extract-profiles-from-readme.js`:
  - Node script to parse `data.md` and generate `src/profiles.js`.
  - Run before build (e.g., `prebuild` script in `package.json`).

- `src/profiles.js`:
  - Generated file: `export const profiles = [...]`.

- `src/githubClient.js`: client code above.

- `src/components/`:
  - `ProfileCard.jsx`
  - `Filters.jsx`
  - `StatsBar.jsx`

## Deliverables

Please implement:

1. The Node script to parse the markdown block and generate `src/profiles.js`.
2. A React + JS app that:
   - Imports `profiles` from `src/profiles.js`.
   - Renders the gallery with search/filter/sort.
   - Hydrates cards with GitHub stats + avatars using the REST API with localStorage caching.
3. A minimal but clean responsive layout.
4. README instructions for running locally and deploying to GitHub Pages.

Focus on clarity and maintainability over cleverness.