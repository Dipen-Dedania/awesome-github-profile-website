import { useEffect, useMemo, useState } from 'react';

const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Ruby: '#701516',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  Shell: '#89e051',
  PHP: '#4F5D95',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Dart: '#00B4AB',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  SCSS: '#c6538c',
  Jupyter: '#DA5B0B',
  Astro: '#ff5a03',
  MDX: '#fcb32c',
};

function StarIcon() {
  return (
    <svg
      className="stat-icon"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M8 .6l2.06 4.17 4.6.67-3.33 3.24.79 4.58L8 11.1l-4.12 2.16.79-4.58L1.34 5.44l4.6-.67L8 .6z"
      />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg
      className="stat-icon"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M5 2.5a2.5 2.5 0 11-1 2v3.2c0 .39.16.76.44 1.04L6.3 10.6c.28.28.44.65.44 1.04V12.5a2.5 2.5 0 11-1 0v-.86a.5.5 0 00-.15-.35L3.73 9.42A2.47 2.47 0 013 7.7V4.5a2.5 2.5 0 012-2zm6 0a2.5 2.5 0 11-1 2v8a2.5 2.5 0 11-1 0v-8a2.5 2.5 0 012-2z"
      />
    </svg>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function isTrending(stats) {
  if (!stats) return false;
  if ((stats.stars || 0) < 50) return false;
  if (!stats.updatedAt) return false;
  const daysSinceUpdate =
    (Date.now() - new Date(stats.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceUpdate <= 90;
}

export default function ProfileCard({
  profile,
  repoStats,
  userStats,
  isHydratingStats = false,
}) {
  const trending = isTrending(repoStats);
  const langColor = LANG_COLORS[repoStats?.language] || '#8b8b9e';
  const updated = timeAgo(repoStats?.updatedAt);

  const coverCandidates = useMemo(() => {
    const author = (profile.author || '').trim();
    if (!author) return [];

    const base = import.meta.env.BASE_URL || '/';
    const list = [`${base}screenshots/${author}.png`];
    const lower = author.toLowerCase();
    if (lower !== author) list.push(`${base}screenshots/${lower}.png`);
    return list;
  }, [profile.author]);

  const [coverIndex, setCoverIndex] = useState(0);
  useEffect(() => {
    setCoverIndex(0);
  }, [profile.author]);

  const coverSrc = coverCandidates[coverIndex] || null;

  return (
    <div className="profile-card" id={`card-${profile.id}`}>
      <div className="card-glow" />

      {trending && <div className="trending-badge">Trending</div>}

      <div className="card-cover">
        {coverSrc ? (
          <img
            className="card-cover-img"
            src={coverSrc}
            alt={`${profile.author} portfolio preview`}
            loading="lazy"
            onError={() => setCoverIndex((prev) => prev + 1)}
          />
        ) : (
          <div className="card-cover-fallback">Screenshot unavailable</div>
        )}
      </div>

      <div className="card-header">
        {userStats?.avatarUrl ? (
          <img
            className="card-avatar"
            src={userStats.avatarUrl}
            alt={profile.author}
            loading="lazy"
            width={44}
            height={44}
          />
        ) : (
          <div className="card-avatar-placeholder">
            {(profile.author || profile.name || '?')[0].toUpperCase()}
          </div>
        )}

        <div className="card-title-group">
          <div className="card-title">
            <a href={profile.siteUrl} target="_blank" rel="noopener noreferrer">
              {profile.name}
            </a>
          </div>
          <div className="card-author">
            <a
              href={userStats?.htmlUrl || `https://github.com/${profile.author}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{profile.author}
            </a>
            {userStats?.followers != null && (
              <span className="followers-info">
                {' '}
                · {userStats.followers.toLocaleString()} followers
              </span>
            )}
          </div>
          <span className={`type-badge ${profile.type}`}>{profile.type}</span>
        </div>
      </div>

      <div className="card-body">
        <div className="card-description">
          {repoStats?.description || 'No description available.'}
        </div>

        <div className="card-stats-row">
          {repoStats ? (
            <>
              <div className="card-stat">
                <StarIcon />
                <span className="stat-label">
                  {(repoStats.stars || 0).toLocaleString()}
                </span>
              </div>
              <div className="card-stat">
                <ForkIcon />
                <span className="stat-label">
                  {(repoStats.forks || 0).toLocaleString()}
                </span>
              </div>
              {repoStats.language && (
                <span className="card-language-badge">
                  <span className="language-dot" style={{ background: langColor }} />
                  {repoStats.language}
                </span>
              )}
              {updated && <span className="card-updated">Updated {updated}</span>}
            </>
          ) : isHydratingStats ? (
            <>
              <div className="skeleton" style={{ width: 50, height: 16 }} />
              <div className="skeleton" style={{ width: 50, height: 16 }} />
              <div className="skeleton" style={{ width: 70, height: 16 }} />
            </>
          ) : (
            <>
              <div className="card-stat">
                <StarIcon />
                <span className="stat-label">0</span>
              </div>
              <div className="card-stat">
                <ForkIcon />
                <span className="stat-label">0</span>
              </div>
              <span className="card-updated">Stats unavailable</span>
            </>
          )}
        </div>
      </div>

      <div className="card-actions">
        {profile.siteUrl && (
          <a
            className="card-action-btn primary"
            href={profile.siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            id={`view-site-${profile.id}`}
          >
            View site
          </a>
        )}
        {profile.repoUrl && (
          <a
            className="card-action-btn"
            href={profile.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            id={`view-code-${profile.id}`}
          >
            View code
          </a>
        )}
      </div>
    </div>
  );
}
