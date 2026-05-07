import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const LIKED_STORAGE_KEY = 'liked_portfolios';
const SWIPE_THRESHOLD = 110;
const EXIT_ANIMATION_MS = 320;
const BASE_PATH = import.meta.env.BASE_URL || '/';

function getStoredLikes() {
  if (typeof window === 'undefined') return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LIKED_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getProfileSummary(profile, repoStats, userStats) {
  const screenshotCandidates = getScreenshotCandidates(profile.author);
  const tags = [
    profile.type,
    repoStats?.language,
    ...(profile.tags || []),
    ...(profile.stack || []),
  ].filter(Boolean);

  return {
    id: profile.id,
    name: profile.name,
    author: profile.author,
    siteUrl: profile.siteUrl,
    avatarUrl: userStats?.avatarUrl || `https://github.com/${profile.author}.png?size=160`,
    screenshotUrl: screenshotCandidates[0] || null,
    description:
      repoStats?.description ||
      `${profile.author}'s GitHub-hosted portfolio website.`,
    tags: [...new Set(tags)].slice(0, 5),
  };
}

function getScreenshotCandidates(author) {
  const trimmedAuthor = (author || '').trim();
  if (!trimmedAuthor) return [];

  const candidates = [`${BASE_PATH}screenshots/${trimmedAuthor}.png`];
  const lowerAuthor = trimmedAuthor.toLowerCase();
  if (lowerAuthor !== trimmedAuthor) {
    candidates.push(`${BASE_PATH}screenshots/${lowerAuthor}.png`);
  }

  return candidates;
}

function SwipeCard({
  profile,
  repoStats,
  userStats,
  drag,
  isActive,
  isExiting,
  exitDirection,
  onPointerDown,
  onSkip,
  onLike,
}) {
  const summary = getProfileSummary(profile, repoStats, userStats);
  const coverCandidates = useMemo(
    () => getScreenshotCandidates(profile.author),
    [profile.author],
  );
  const [coverIndex, setCoverIndex] = useState(0);
  const intent = drag.x > 24 ? 'like' : drag.x < -24 ? 'skip' : null;
  const intensity = Math.min(Math.abs(drag.x) / SWIPE_THRESHOLD, 1);
  const coverSrc = coverCandidates[coverIndex] || null;
  const style = isActive
    ? {
        transform: isExiting
          ? `translate(${exitDirection === 'like' ? 130 : -130}vw, -18px) rotate(${
              exitDirection === 'like' ? 18 : -18
            }deg)`
          : `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 14}deg)`,
      }
    : undefined;

  useEffect(() => {
    setCoverIndex(0);
  }, [profile.author]);

  return (
    <article
      className={`swipe-card ${isActive ? 'swipe-card--active' : ''} ${
        isExiting ? `swipe-card--exit-${exitDirection}` : ''
      }`}
      style={style}
      onPointerDown={isActive ? onPointerDown : undefined}
      aria-label={`${summary.name} portfolio card`}
    >
      {isActive && (
        <>
          <div
            className="swipe-feedback swipe-feedback--like"
            style={{ opacity: intent === 'like' ? intensity : 0 }}
          >
            LIKE
          </div>
          <div
            className="swipe-feedback swipe-feedback--skip"
            style={{ opacity: intent === 'skip' ? intensity : 0 }}
          >
            SKIP
          </div>
        </>
      )}

      <div className="swipe-card-drag-area">
        <div className="swipe-card-cover">
          {coverSrc ? (
            <img
              className="swipe-card-cover-img"
              src={coverSrc}
              alt={`${summary.name} portfolio screenshot`}
              draggable="false"
              onError={() => setCoverIndex((prev) => prev + 1)}
            />
          ) : (
            <div className="swipe-card-cover-fallback">
              <span>{summary.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="swipe-card-cover-shade" />
          <div className="swipe-card-topline">
            <span className={`type-badge ${profile.type}`}>{profile.type}</span>
            <span className="swipe-author">@{summary.author}</span>
          </div>
          <img
            className="swipe-avatar"
            src={summary.avatarUrl}
            alt={summary.author}
            draggable="false"
          />
        </div>

        <div className="swipe-card-body">
          <h2 className="swipe-card-title">{summary.name}</h2>
          <p className="swipe-card-description">{summary.description}</p>

          <div className="swipe-tags" aria-label="Portfolio tags">
            {summary.tags.length ? (
              summary.tags.map((tag) => (
                <span className="swipe-tag" key={tag}>
                  {tag}
                </span>
              ))
            ) : (
              <span className="swipe-tag">portfolio</span>
            )}
          </div>
        </div>
      </div>

      <div className="swipe-card-actions" data-no-card-drag>
        <button
          type="button"
          className="swipe-round-btn swipe-round-btn--skip"
          onClick={onSkip}
          aria-label={`Skip ${summary.name}`}
        >
          <span aria-hidden="true">{'\u00d7'}</span>
        </button>
        <a
          className="swipe-visit-btn"
          href={summary.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit Portfolio
        </a>
        <button
          type="button"
          className="swipe-round-btn swipe-round-btn--like"
          onClick={onLike}
          aria-label={`Like ${summary.name}`}
        >
          <span aria-hidden="true">{'\u2665'}</span>
        </button>
      </div>
    </article>
  );
}

function LikedPortfolioCard({ item, onRemove }) {
  const screenshotCandidates = useMemo(
    () => [
      item.screenshotUrl,
      ...getScreenshotCandidates(item.author).filter(
        (src) => src && src !== item.screenshotUrl,
      ),
    ].filter(Boolean),
    [item.author, item.screenshotUrl],
  );
  const [screenshotIndex, setScreenshotIndex] = useState(0);
  const screenshotSrc = screenshotCandidates[screenshotIndex] || null;

  useEffect(() => {
    setScreenshotIndex(0);
  }, [item.id]);

  return (
    <article className="liked-card">
      <button
        type="button"
        className="liked-remove-btn"
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.name}`}
      >
        <span aria-hidden="true">{'\u00d7'}</span>
      </button>

      <div className="liked-card-preview">
        {screenshotSrc ? (
          <img
            src={screenshotSrc}
            alt={`${item.name} portfolio screenshot`}
            className="liked-screenshot"
            onError={() => setScreenshotIndex((prev) => prev + 1)}
          />
        ) : (
          <div className="liked-screenshot-fallback">
            <span>{item.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="liked-card-preview-shade" />
        <img src={item.avatarUrl} alt={item.author} className="liked-avatar" />
      </div>

      <div className="liked-card-info">
        <h3>{item.name}</h3>
        <p>@{item.author}</p>
      </div>

      <a
        className="swipe-visit-btn"
        href={item.siteUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        Visit
      </a>
    </article>
  );
}

export default function SwipeView({
  profiles,
  repoStatsMap,
  userStatsMap,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedProfiles, setLikedProfiles] = useState(() => getStoredLikes());
  const [showLikedPanel, setShowLikedPanel] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [exitDirection, setExitDirection] = useState(null);
  const dragRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    dragging: false,
  });
  const exitTimerRef = useRef(null);

  const deckProfiles = useMemo(
    () =>
      profiles.map((profile) =>
        getProfileSummary(
          profile,
          repoStatsMap[profile.id],
          userStatsMap[profile.author?.toLowerCase()] || userStatsMap[profile.author],
        ),
      ),
    [profiles, repoStatsMap, userStatsMap],
  );

  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);
  const activeProfile = profiles[currentIndex];
  const activeSummary = deckProfiles[currentIndex];
  const isFinished = currentIndex >= profiles.length;

  useEffect(() => {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(likedProfiles));
  }, [likedProfiles]);

  useEffect(
    () => () => {
      if (exitTimerRef.current) window.clearTimeout(exitTimerRef.current);
    },
    [],
  );

  const visitActive = useCallback(() => {
    if (!activeProfile?.siteUrl) return;
    window.open(activeProfile.siteUrl, '_blank', 'noopener,noreferrer');
  }, [activeProfile]);

  const completeSwipe = useCallback(
    (direction) => {
      if (!activeProfile || exitDirection) return;

      setExitDirection(direction);
      if (direction === 'like' && activeSummary) {
        setLikedProfiles((prev) => {
          const withoutDuplicate = prev.filter((item) => item.id !== activeSummary.id);
          return [activeSummary, ...withoutDuplicate];
        });
      }

      exitTimerRef.current = window.setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setDrag({ x: 0, y: 0 });
        setExitDirection(null);
      }, EXIT_ANIMATION_MS);
    },
    [activeProfile, activeSummary, exitDirection],
  );

  const handlePointerDown = useCallback((event) => {
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest('[data-no-card-drag]')) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: true,
    };
  }, []);

  const handlePointerMove = useCallback((event) => {
    const state = dragRef.current;
    if (!state.dragging || state.pointerId !== event.pointerId || exitDirection) return;
    setDrag({
      x: event.clientX - state.startX,
      y: event.clientY - state.startY,
    });
  }, [exitDirection]);

  const finishPointerDrag = useCallback(
    (event) => {
      const state = dragRef.current;
      if (!state.dragging || state.pointerId !== event.pointerId) return;

      const finalX = event.clientX - state.startX;
      dragRef.current.dragging = false;

      if (finalX > SWIPE_THRESHOLD) {
        completeSwipe('like');
      } else if (finalX < -SWIPE_THRESHOLD) {
        completeSwipe('skip');
      } else {
        setDrag({ x: 0, y: 0 });
      }
    },
    [completeSwipe],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (showLikedPanel) return;
      const target = event.target;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) {
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        completeSwipe('like');
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        completeSwipe('skip');
      } else if (event.key === 'Enter') {
        event.preventDefault();
        visitActive();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completeSwipe, showLikedPanel, visitActive]);

  const removeLiked = useCallback((id) => {
    setLikedProfiles((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearLiked = useCallback(() => {
    setLikedProfiles([]);
  }, []);

  return (
    <section
      className="swipe-view"
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointerDrag}
      onPointerCancel={finishPointerDrag}
    >
      <div className="swipe-hero">
        <div>
          <span className="setup-chip">Swipe Mode</span>
          <h1 className="swipe-title">Browse portfolios one card at a time</h1>
          <p className="swipe-subtitle">
            Keep the ones that catch your eye, skip the rest, and come back to your saved picks whenever inspiration strikes.
          </p>
        </div>
        <button
          type="button"
          className="swipe-finish-btn"
          onClick={() => setShowLikedPanel(true)}
        >
          Finish Browsing
          <span>{likedProfiles.length}</span>
        </button>
      </div>

      <div className="swipe-layout">
        <div className="swipe-deck-shell">
          <div className={`swipe-deck ${isFinished ? 'swipe-deck--empty' : ''}`}>
            {isFinished ? (
              <div className="swipe-empty-deck">
                <div className="swipe-empty-mark">{'\u2665'}</div>
                <h2>That is the full deck.</h2>
                <p>Open your saved picks or refresh the page to browse again.</p>
                <button
                  type="button"
                  className="swipe-visit-btn"
                  onClick={() => setShowLikedPanel(true)}
                >
                  See My Picks
                </button>
              </div>
            ) : (
              visibleProfiles
                .map((profile, offset) => {
                  const repoStats = repoStatsMap[profile.id];
                  const userStats =
                    userStatsMap[profile.author?.toLowerCase()] ||
                    userStatsMap[profile.author];
                  return (
                    <div
                      className={`swipe-card-layer swipe-card-layer--${offset}`}
                      key={profile.id}
                      aria-hidden={offset > 0}
                    >
                      <SwipeCard
                        profile={profile}
                        repoStats={repoStats}
                        userStats={userStats}
                        drag={offset === 0 ? drag : { x: 0, y: 0 }}
                        isActive={offset === 0}
                        isExiting={offset === 0 && Boolean(exitDirection)}
                        exitDirection={exitDirection}
                        onPointerDown={handlePointerDown}
                        onSkip={() => completeSwipe('skip')}
                        onLike={() => completeSwipe('like')}
                      />
                    </div>
                  );
                })
                .reverse()
            )}
          </div>

          <div className="swipe-keyboard-hint">
            <kbd>{'\u2190'}</kbd> Skip
            <kbd>{'\u2192'}</kbd> Like
            <kbd>Enter</kbd> Visit
          </div>
        </div>

        <aside className="swipe-side-panel">
          <div className="swipe-side-stat">
            <strong>{Math.min(currentIndex + 1, profiles.length)}</strong>
            <span>of {profiles.length}</span>
          </div>
          <div className="swipe-side-stat">
            <strong>{likedProfiles.length}</strong>
            <span>liked</span>
          </div>
          <p>
            Drag right to like or left to skip. Your picks are saved in this browser under <code>{LIKED_STORAGE_KEY}</code>.
          </p>
        </aside>
      </div>

      {showLikedPanel && (
        <div className="liked-panel-backdrop" role="presentation">
          <section
            className="liked-panel"
            aria-label="My liked portfolios"
          >
            <div className="liked-panel-header">
              <div>
                <span className="setup-chip">My Liked Portfolios</span>
                <h2>{likedProfiles.length} saved pick{likedProfiles.length === 1 ? '' : 's'}</h2>
              </div>
              <div className="liked-panel-actions">
                {likedProfiles.length > 0 && (
                  <button type="button" className="liked-clear-btn" onClick={clearLiked}>
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  className="liked-close-btn"
                  onClick={() => setShowLikedPanel(false)}
                  aria-label="Close liked portfolios"
                >
                  <span aria-hidden="true">{'\u00d7'}</span>
                </button>
              </div>
            </div>

            {likedProfiles.length === 0 ? (
              <div className="liked-empty-state">
                <h3>You have not liked any portfolios yet.</h3>
                <p>Go back and swipe some.</p>
                <button
                  type="button"
                  className="swipe-visit-btn"
                  onClick={() => setShowLikedPanel(false)}
                >
                  Back to Swipe
                </button>
              </div>
            ) : (
              <div className="liked-grid">
                {likedProfiles.map((item) => (
                  <LikedPortfolioCard
                    key={item.id}
                    item={item}
                    onRemove={removeLiked}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
