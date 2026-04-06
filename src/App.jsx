import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { profiles } from './profiles.js';
import { hydrateProfileStats } from './githubClient.js';
import { getFirebaseCacheStatus } from './firebaseCache.js';
import StatsBar from './components/StatsBar.jsx';
import Filters from './components/Filters.jsx';
import ProfileCard from './components/ProfileCard.jsx';
import LandingSection from './components/LandingSection.jsx';
import ProfileBook from './components/ProfileBook.jsx';

import logo from './assets/logo.png';

export default function App() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sort, setSort] = useState('name-asc');
  const [repoStatsMap, setRepoStatsMap] = useState({});
  const [userStatsMap, setUserStatsMap] = useState({});
  const [cacheSummary, setCacheSummary] = useState({
    repoCount: 0,
    userCount: 0,
    totalCount: 0,
    syncedAt: null,
  });
  const [isHydratingStats, setIsHydratingStats] = useState(true);
  const [currentView, setCurrentView] = useState('landing');
  const debounceTimer = useRef(null);

  // Debounce search
  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  }, []);

  // Hydrate cards from shared/local cache and refresh stale records.
  useEffect(() => {
    let cancelled = false;

    if (import.meta.env.DEV) {
      const status = getFirebaseCacheStatus();
      console.info('[github-cache] Firebase enabled:', status.enabled);
      if (!status.enabled) {
        console.info(
          '[github-cache] Missing Firebase config keys:',
          status.missingKeys.join(', '),
        );
      }
    }

    const repoKeyToProfileIds = {};
    for (const profile of profiles) {
      if (!profile.repoUrl) continue;
      try {
        const u = new URL(profile.repoUrl);
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts.length < 2) continue;
        const key = `${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`;
        if (!repoKeyToProfileIds[key]) repoKeyToProfileIds[key] = [];
        repoKeyToProfileIds[key].push(profile.id);
      } catch {
        // Ignore invalid URLs.
      }
    }

    Promise.resolve(
      hydrateProfileStats(profiles, {
        onRepoStat(repoKey, stat) {
          if (cancelled || !stat) return;
          const profileIds = repoKeyToProfileIds[repoKey] || [];
          if (profileIds.length === 0) return;
          setRepoStatsMap((prev) => {
            const next = { ...prev };
            for (const id of profileIds) next[id] = stat;
            return next;
          });
        },
        onUserStat(usernameKey, stat) {
          if (cancelled || !stat) return;
          setUserStatsMap((prev) => ({ ...prev, [usernameKey]: stat }));
        },
      }),
    ).then((summary) => {
      if (!cancelled && summary) {
        setCacheSummary(summary);
      }
    }).finally(() => {
      if (!cancelled) {
        setIsHydratingStats(false);
      }
    });

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
          <div className="header-brand" onClick={() => setCurrentView('landing')}>
            <div className="header-icon">
              <img src={logo} alt="Logo" />
            </div>
            <div>
              <h1 className="header-title">Awesome GitHub Websites</h1>
              <p className="header-subtitle">
                Curated gallery of GitHub-hosted profile sites &amp; templates
              </p>
            </div>
          </div>
          <nav className="nav-links">
            <a 
              className={`nav-link ${currentView === 'templates' ? 'active' : ''}`}
              onClick={() => setCurrentView('templates')}
            >
              Templates Gallery
            </a>
            <a
              className={`nav-link ${currentView === 'book' ? 'active' : ''}`}
              onClick={() => setCurrentView('book')}
              id="profile-book-nav"
            >
              📖 Profile Book
            </a>
            <a
              className="github-link"
              href="https://github.com/Dipen-Dedania/awesome-github-profile-website"
              target="_blank"
              rel="noopener noreferrer"
              id="github-repo-link"
            >
              ⭐ Star on GitHub
            </a>
          </nav>
        </div>
      </header>

      <main className="container">
        {currentView === 'landing' ? (
          <LandingSection 
            profiles={profiles} 
            repoStatsMap={repoStatsMap} 
            userStatsMap={userStatsMap} 
            isHydratingStats={isHydratingStats}
            onBrowseTemplates={() => setCurrentView('templates')}
          />
        ) : currentView === 'book' ? (
          <ProfileBook
            profiles={profiles}
            repoStatsMap={repoStatsMap}
            userStatsMap={userStatsMap}
            isHydratingStats={isHydratingStats}
          />
        ) : (
          <>
            {/* Stats */}
            <StatsBar
              profiles={profiles}
              repoStatsMap={repoStatsMap}
              cacheSummary={cacheSummary}
            />

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
                    isHydratingStats={isHydratingStats}
                    userStats={
                      userStatsMap[profile.author?.toLowerCase()] ||
                      userStatsMap[profile.author]
                    }
                  />
                ))
              )}
            </div>
          </>
        )}
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
        · Data sourced from data.md ·{' '}
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
