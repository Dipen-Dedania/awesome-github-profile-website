import React, { useRef, useState, useCallback, useEffect, forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';

// ─── Helpers ────────────────────────────────────────────────────────────────
const BASE = import.meta.env.BASE_URL;

function formatStars(n) {
  if (!n) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function avatarUrl(author) {
  return `https://github.com/${author}.png?size=80`;
}

function screenshotUrl(author) {
  return `${BASE}screenshots/${author}.png`;
}

// ─── Page wrapper (forwardRef required by react-pageflip) ────────────────────
const BookPage = forwardRef(({ children, className = '' }, ref) => (
  <div ref={ref} className={`book-page ${className}`}>
    {children}
  </div>
));
BookPage.displayName = 'BookPage';

// ─── Cover page ─────────────────────────────────────────────────────────────
const CoverPage = forwardRef(({ total }, ref) => (
  <BookPage ref={ref} className="book-page--cover">
    <div className="cover-inner">
      <div className="cover-sparkles" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <span key={i} className="cover-sparkle" style={{ '--i': i }} />
        ))}
      </div>
      <div className="cover-badge">Volume I</div>
      <div className="cover-icon">📖</div>
      <h1 className="cover-title">
        Awesome<br />
        <span className="cover-title-accent">GitHub Profiles</span>
      </h1>
      <p className="cover-subtitle">
        {total}+ hand-curated profile websites<br />
        built by developers worldwide
      </p>
      <div className="cover-cta">Flip through the pages →</div>
      <div className="cover-footer">awesomegithubprofiles.dev</div>
    </div>
  </BookPage>
));
CoverPage.displayName = 'CoverPage';

// ─── Table of Contents page ──────────────────────────────────────────────────
const TocPage = forwardRef(({ profiles, currentPage, onGoToPage }, ref) => {
  // Show first 14 entries in TOC
  const entries = profiles.slice(0, 14);
  return (
    <BookPage ref={ref} className="book-page--toc">
      <div className="toc-inner">
        <div className="toc-header">
          <div className="toc-chapter">Contents</div>
          <h2 className="toc-title">Table of Profiles</h2>
          <div className="toc-divider" />
        </div>
        <ul className="toc-list">
          {entries.map((p, i) => {
            const pageNum = i * 2 + 4; // cover + toc-left + toc-right = page 3/4
            return (
              <li
                key={p.id}
                className="toc-item"
                onClick={() => onGoToPage(pageNum)}
                role="button"
                tabIndex={0}
              >
                <span className="toc-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="toc-name">{p.name}</span>
                <span className="toc-dots" />
                <span className="toc-page">{pageNum}</span>
              </li>
            );
          })}
        </ul>
        {profiles.length > 14 && (
          <p className="toc-more">+ {profiles.length - 14} more profiles inside…</p>
        )}
      </div>
    </BookPage>
  );
});
TocPage.displayName = 'TocPage';

// ─── Single profile page ─────────────────────────────────────────────────────
const ProfilePage = forwardRef(({ profile, repoStats, userStats, pageNum, side }, ref) => {
  const [imgFailed, setImgFailed] = useState(false);
  const stars = repoStats?.stars;
  const forks = repoStats?.forks;
  const followers = userStats?.followers;
  const language = repoStats?.language;

  const langColors = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Python: '#3572a5',
    Vue: '#41b883',
    Svelte: '#ff3e00',
    'C++': '#f34b7d',
    Ruby: '#701516',
    Go: '#00add8',
    Rust: '#dea584',
    Java: '#b07219',
  };

  return (
    <BookPage ref={ref} className={`book-page--profile book-page--${side}`}>
      <div className="profile-page-inner">
        {/* Page number ribbon */}
        <div className="page-ribbon">
          <span className="page-num-label">p.{pageNum}</span>
        </div>

        {/* Screenshot */}
        <div className="profile-screenshot-wrap">
          {!imgFailed ? (
            <img
              src={screenshotUrl(profile.author)}
              alt={`${profile.name} preview`}
              className="profile-screenshot"
              onError={() => setImgFailed(true)}
              loading="lazy"
            />
          ) : (
            <div className="profile-screenshot-fallback">
              <span className="profile-screenshot-initial">
                {profile.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="profile-screenshot-overlay" />
          {/* Type badge */}
          <div className={`profile-type-badge profile-type-badge--${profile.type}`}>
            {profile.type === 'personal' ? '👤 Personal' : '🎨 Template'}
          </div>
        </div>

        {/* Info section */}
        <div className="profile-info">
          <div className="profile-info-header">
            <img
              src={avatarUrl(profile.author)}
              alt={profile.author}
              className="profile-avatar-sm"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="profile-info-meta">
              <h3 className="profile-info-name">{profile.name}</h3>
              <a
                href={`https://github.com/${profile.author}`}
                target="_blank"
                rel="noopener noreferrer"
                className="profile-info-author"
              >
                @{profile.author}
              </a>
            </div>
          </div>

          {/* Stats row */}
          <div className="profile-stats-strip">
            {stars !== undefined && (
              <div className="profile-stat-chip">
                <span className="chip-icon">⭐</span>
                <span className="chip-val">{formatStars(stars)}</span>
              </div>
            )}
            {forks !== undefined && (
              <div className="profile-stat-chip">
                <span className="chip-icon">🍴</span>
                <span className="chip-val">{formatStars(forks)}</span>
              </div>
            )}
            {followers !== undefined && (
              <div className="profile-stat-chip">
                <span className="chip-icon">👥</span>
                <span className="chip-val">{formatStars(followers)}</span>
              </div>
            )}
            {language && (
              <div className="profile-stat-chip">
                <span
                  className="chip-lang-dot"
                  style={{ background: langColors[language] || '#8b8b9e' }}
                />
                <span className="chip-val">{language}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {repoStats?.description && (
            <p className="profile-description">{repoStats.description}</p>
          )}

          {/* Action links */}
          <div className="profile-links">
            <a
              href={profile.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-link-btn profile-link-btn--primary"
            >
              🌐 Live Site
            </a>
            <a
              href={profile.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-link-btn profile-link-btn--ghost"
            >
              &lt;/&gt; Source
            </a>
          </div>
        </div>
      </div>
    </BookPage>
  );
});
ProfilePage.displayName = 'ProfilePage';

// ─── Back cover ──────────────────────────────────────────────────────────────
const BackCoverPage = forwardRef((_, ref) => (
  <BookPage ref={ref} className="book-page--back-cover">
    <div className="back-cover-inner">
      <div className="back-cover-sparkles" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <span key={i} className="cover-sparkle" style={{ '--i': i + 4 }} />
        ))}
      </div>
      <div className="back-cover-icon">🚀</div>
      <h2 className="back-cover-title">Showcase Your Profile</h2>
      <p className="back-cover-text">
        Built something amazing? Submit your GitHub profile website and get featured in the next edition.
      </p>
      <a
        href="https://github.com/Dipen-Dedania/awesome-github-profile-website"
        target="_blank"
        rel="noopener noreferrer"
        className="back-cover-btn"
      >
        ⭐ Contribute on GitHub
      </a>
      <div className="back-cover-footer">Made with ❤️ by the community</div>
    </div>
  </BookPage>
));
BackCoverPage.displayName = 'BackCoverPage';

// ─── Main Book component ─────────────────────────────────────────────────────
export default function ProfileBook({ profiles, repoStatsMap, userStatsMap, isHydratingStats }) {
  const bookRef = useRef(null);
  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [bookSize, setBookSize] = useState({ width: 500, height: 700 });

  // Responsive sizing — portrait mode is always OFF to prevent next-page bleed
  useEffect(() => {
    function calcSize() {
      const vw = window.innerWidth;
      if (vw < 600) {
        // Single-page mobile: take almost full width
        setBookSize({ width: Math.min(vw - 24, 380), height: 580 });
      } else if (vw < 1100) {
        setBookSize({ width: 400, height: 620 });
      } else {
        setBookSize({ width: 500, height: 700 });
      }
    }
    calcSize();
    window.addEventListener('resize', calcSize);
    return () => window.removeEventListener('resize', calcSize);
  }, []);

  const handleFlip = useCallback((e) => {
    // e.data is the current page index (number)
    const idx = typeof e.data === 'number' ? e.data : (e.data?.page ?? 0);
    setCurrentPage(idx);
  }, []);

  const handleInit = useCallback(() => {
    // onInit e.data is {page, mode} — use the API method for total count
    const count = bookRef.current?.pageFlip()?.getPageCount();
    if (typeof count === 'number') setTotalPages(count);
  }, []);

  const flipNext = () => bookRef.current?.pageFlip()?.flipNext();
  const flipPrev = () => bookRef.current?.pageFlip()?.flipPrev();
  const goToPage = (p) => bookRef.current?.pageFlip()?.turnToPage(p);

  // Keyboard nav
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') flipNext();
      if (e.key === 'ArrowLeft') flipPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const pageCount = 2 + profiles.length + 2; // cover + 2 toc + profiles + back cover
  const progressPct = totalPages > 0 ? Math.round((currentPage / (totalPages - 1)) * 100) : 0;

  return (
    <div className="book-view" ref={containerRef}>
      {/* Flipbook stage */}
      <div className="book-stage">
        {/* Decorative shelf */}
        <div className="book-shelf-shadow" />

        <HTMLFlipBook
          ref={bookRef}
          width={bookSize.width}
          height={bookSize.height}
          size="fixed"
          minWidth={320}
          maxWidth={560}
          minHeight={480}
          maxHeight={760}
          showCover={true}
          flippingTime={900}
          drawShadow={true}
          usePortrait={false}
          mobileScrollSupport={true}
          className="book-flipbook"
          onFlip={handleFlip}
          onInit={handleInit}
          startPage={0}
        >
          {/* 1. Front Cover */}
          <CoverPage total={profiles.length} />

          {/* 2. TOC Left */}
          <TocPage profiles={profiles} currentPage={currentPage} onGoToPage={goToPage} />

          {/* 3. TOC Right – blank or intro */}
          <BookPage className="book-page--intro">
            <div className="intro-inner">
              <div className="intro-quote">
                "Your GitHub profile is the new resume."
              </div>
              <div className="intro-line" />
              <div className="intro-body">
                This collection features hand-curated personal websites and portfolio templates from developers around the world — all hosted on GitHub Pages.
              </div>
              <div className="intro-tag-cloud">
                {['React', 'Next.js', 'Vue', 'Svelte', 'HTML/CSS', 'Three.js', 'GSAP', 'Tailwind'].map(t => (
                  <span key={t} className="intro-tag">{t}</span>
                ))}
              </div>
              <div className="intro-chapter">Chapter I — Personal Sites</div>
            </div>
          </BookPage>

          {/* 4+. Profile pages – one profile per page */}
          {profiles.map((profile, i) => (
            <ProfilePage
              key={profile.id}
              profile={profile}
              repoStats={repoStatsMap[profile.id]}
              userStats={
                userStatsMap[profile.author?.toLowerCase()] ||
                userStatsMap[profile.author]
              }
              pageNum={i + 4}
              side={i % 2 === 0 ? 'left' : 'right'}
            />
          ))}

          {/* Last – Back Cover */}
          <BackCoverPage />
        </HTMLFlipBook>
      </div>

      {/* Controls bar */}
      <div className="book-controls">
        <button
          className="book-ctrl-btn"
          onClick={flipPrev}
          disabled={currentPage === 0}
          aria-label="Previous page"
          id="book-prev-btn"
        >
          ← Prev
        </button>

        <div className="book-progress">
          <div className="book-progress-bar" style={{ width: `${progressPct}%` }} />
          <span className="book-page-counter">
            {currentPage + 1} / {totalPages || pageCount}
          </span>
        </div>

        <button
          className="book-ctrl-btn"
          onClick={flipNext}
          disabled={totalPages > 0 && currentPage >= totalPages - 1}
          aria-label="Next page"
          id="book-next-btn"
        >
          Next →
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="book-hint">
        <kbd>←</kbd> <kbd>→</kbd> arrow keys also work · click the page edges to flip
      </p>

      
      {/* Hero heading */}
      <div className="book-view-header">
        <h2 className="book-view-title">
          <span className="title-gradient">GitHub Profiles</span> — The Book
        </h2>
        <p className="book-view-subtitle">
          Flip through {profiles.length}+ curated developer portfolios. Use arrow keys or the controls below.
        </p>
      </div>
    </div>
  );
}
