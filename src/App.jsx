import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { profiles } from './profiles.js';
import { fetchRepoStats, fetchUserStats } from './githubClient.js';
import StatsBar from './components/StatsBar.jsx';
import Filters from './components/Filters.jsx';
import ProfileCard from './components/ProfileCard.jsx';

function extractOwnerRepo(repoUrl) {
  try {
    const u = new URL(repoUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    return { owner: parts[0], repo: parts[1] };
  } catch {
    return { owner: null, repo: null };
  }
}

export default function App() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('name-asc');
  const [repoStatsMap, setRepoStatsMap] = useState({});
  const [userStatsMap, setUserStatsMap] = useState({});
  const debounceTimer = useRef(null);

  // Debounce search
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  }, []);

  // Hydrate cards with GitHub stats
  useEffect(() => {
    let cancelled = false;
    const seenUsers = new Set();

    async function hydrate() {
      for (const profile of profiles) {
        if (cancelled) break;

        // Fetch repo stats
        if (profile.repoUrl) {
          const { owner, repo } = extractOwnerRepo(profile.repoUrl);
          if (owner && repo) {
            const stats = await fetchRepoStats(owner, repo);
            if (!cancelled && stats) {
              setRepoStatsMap((prev) => ({ ...prev, [profile.id]: stats }));
            }
          }
        }

        // Fetch user stats (deduplicate by author)
        if (profile.author && !seenUsers.has(profile.author)) {
          seenUsers.add(profile.author);
          const user = await fetchUserStats(profile.author);
          if (!cancelled && user) {
            setUserStatsMap((prev) => ({ ...prev, [profile.author]: user }));
          }
        }
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter + sort
  const filteredProfiles = useMemo(() => {
    let result = [...profiles];

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((p) => p.type === typeFilter);
    }

    // Search
    const q = debouncedSearch.toLowerCase().trim();
    if (q) {
      result = result.filter((p) => {
        const repoStats = repoStatsMap[p.id];
        const searchable = [
          p.name,
          p.author,
          ...(p.tags || []),
          ...(p.stack || []),
          repoStats?.language,
          repoStats?.description,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchable.includes(q);
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'stars-desc': {
          const sa = repoStatsMap[a.id]?.stars || 0;
          const sb = repoStatsMap[b.id]?.stars || 0;
          return sb - sa;
        }
        case 'updated-desc': {
          const ua = repoStatsMap[a.id]?.updatedAt || '';
          const ub = repoStatsMap[b.id]?.updatedAt || '';
          return ub.localeCompare(ua);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [debouncedSearch, typeFilter, sort, repoStatsMap]);

  return (
    <>
      {/* Header */}
      <header className="site-header">
        <div className="header-inner">
          <div className="header-icon">🚀</div>
          <div>
            <h1 className="header-title">Awesome GitHub Websites</h1>
            <p className="header-subtitle">
              Curated gallery of GitHub-hosted profile sites &amp; templates
            </p>
          </div>
          <a
            className="github-link"
            href="https://github.com/Dipen-Dedania/awesome-github-profile-website"
            target="_blank"
            rel="noopener noreferrer"
            id="github-repo-link"
          >
            ⭐ Star on GitHub
          </a>
        </div>
      </header>

      <main className="container">
        {/* Stats */}
        <StatsBar profiles={profiles} repoStatsMap={repoStatsMap} />

        {/* Filters */}
        <Filters
          search={search}
          onSearchChange={handleSearchChange}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          sort={sort}
          onSortChange={setSort}
        />

        {/* Gallery */}
        <div className="gallery-grid" id="gallery">
          {filteredProfiles.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔎</div>
              <div className="empty-state-title">No profiles found</div>
              <div className="empty-state-text">
                Try adjusting your search or filters.
              </div>
            </div>
          ) : (
            filteredProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                repoStats={repoStatsMap[profile.id]}
                userStats={userStatsMap[profile.author]}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="site-footer">
        Made with ❤️ by{' '}
        <a
          href="https://github.com/Dipen-Dedania"
          target="_blank"
          rel="noopener noreferrer"
        >
          Dipen Dedania
        </a>{' '}
        · Data sourced from README.md ·{' '}
        <a
          href="https://github.com/Dipen-Dedania/awesome-github-profile-website"
          target="_blank"
          rel="noopener noreferrer"
        >
          Contribute
        </a>
      </footer>
    </>
  );
}
