import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { profiles } from './profiles.js';
import { hydrateProfileStats } from './githubClient.js';
import { getFirebaseCacheStatus } from './firebaseCache.js';
import StatsBar from './components/StatsBar.jsx';
import Filters from './components/Filters.jsx';
import ProfileCard from './components/ProfileCard.jsx';
import LandingSection from './components/LandingSection.jsx';
import ProfileBook from './components/ProfileBook.jsx';
import SetupGuide from './components/SetupGuide.jsx';
import FaqSection from './components/FaqSection.jsx';

import logo from './assets/logo.png';

const VIEW_PATHS = {
  landing: '/',
  templates: '/templates',
  book: '/profile-book',
  setup: '/github-pages-setup',
};
const SITE_ORIGIN = (
  import.meta.env.VITE_SITE_URL || 'https://dipen-dedania.github.io'
).replace(/\/+$/, '');
const APP_BASE_PATH = normalizePath(import.meta.env.BASE_URL || '/');
const SITE_NAME = 'Awesome GitHub Websites';
const SOCIAL_IMAGE_URL = getAssetUrl('/screenshots/aarshap.png');

const VIEW_SEO = {
  landing: {
    title:
      'Awesome GitHub Websites | Curated GitHub Profile & Portfolio Inspiration',
    description:
      'Discover hand-picked GitHub-hosted profile websites and portfolio inspiration. Explore standout examples, source links, and design ideas.',
    type: 'WebPage',
    faq: [
      {
        question: 'What is the fastest way to create a GitHub profile website?',
        answer:
          'Pick a template, customize your content, and publish it through GitHub Pages. Most developers can launch a first version in under a day.',
      },
      {
        question: 'Are these examples free to use?',
        answer:
          'Many projects are open source. Always review each repository license before reusing code, design assets, or branding.',
      },
      {
        question: 'Do I need React or a framework to launch on GitHub Pages?',
        answer:
          'No. You can deploy plain HTML/CSS/JS or any static output from frameworks like React, Next.js static export, Astro, and Vue.',
      },
    ],
  },
  templates: {
    title: 'GitHub Profile Website Templates | Awesome GitHub Websites',
    description:
      'Browse a curated templates gallery for GitHub profile websites. Filter by style, stack, and popularity to find the best starter for your portfolio.',
    type: 'CollectionPage',
    faq: [
      {
        question: 'How do I choose the right template?',
        answer:
          'Choose a template that matches your content volume, preferred tech stack, and maintenance effort. Start simple and iterate after launch.',
      },
      {
        question: 'Can I deploy template forks directly on GitHub Pages?',
        answer:
          'Yes. Fork or clone the template repository, update content, push your changes, and enable GitHub Pages from repository settings.',
      },
      {
        question: 'What should I customize first in a portfolio template?',
        answer:
          'Start with your bio, project highlights, social links, and personal branding such as colors, avatar, and contact details.',
      },
    ],
  },
  book: {
    title: 'Profile Book | Awesome GitHub Websites',
    description:
      'Flip through a visual book of curated GitHub profile websites and developer portfolios to discover modern design patterns and ideas.',
    type: 'WebPage',
  },
  setup: {
    title: 'How to Set Up GitHub Pages for Your Portfolio | Awesome GitHub Websites',
    description:
      'Step-by-step guide to launch your GitHub profile website on GitHub Pages, from choosing a template to publishing and sharing your live site.',
    type: 'HowTo',
    faq: [
      {
        question: 'How long does GitHub Pages take to publish changes?',
        answer:
          'Most deployments are available within a few minutes, though first-time setup can occasionally take up to around 10 minutes.',
      },
      {
        question: 'Can I use a custom domain with GitHub Pages?',
        answer:
          'Yes. You can point your domain DNS to GitHub Pages and configure HTTPS support from repository settings.',
      },
      {
        question: 'Do I need GitHub Actions for deployment?',
        answer:
          'Not always. You can publish from a branch and folder directly, or use GitHub Actions when your template needs a build step.',
      },
    ],
  },
};

const TEMPLATES_FAQ_ITEMS = [
  {
    question: 'How many templates should I test before choosing one?',
    answer:
      'Shortlist 2 to 3 strong options, run each locally, and choose the one that lets you publish fastest with your current content.',
  },
  {
    question: 'What matters more for hiring outcomes: design or content?',
    answer:
      'Content clarity usually wins. Use a clean design, but focus on project outcomes, technical decisions, and links to live demos.',
  },
  {
    question: 'Should my template include a blog section from day one?',
    answer:
      'Only if you can maintain it. A polished portfolio with strong projects is better than an empty blog.',
  },
];

function normalizePath(pathname) {
  if (!pathname) return '/';
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function getViewFromPath(pathname) {
  const normalizedPath = normalizePath(pathname);
  const routePath = stripBasePath(normalizedPath);

  if (routePath === VIEW_PATHS.book) return 'book';
  if (routePath === VIEW_PATHS.setup) return 'setup';
  if (routePath === VIEW_PATHS.templates) return 'templates';
  return 'landing';
}

function stripBasePath(pathname) {
  if (APP_BASE_PATH === '/') return pathname;
  if (pathname === APP_BASE_PATH) return '/';
  if (pathname.startsWith(`${APP_BASE_PATH}/`)) {
    return pathname.slice(APP_BASE_PATH.length) || '/';
  }
  return pathname;
}

function getPathForView(view) {
  const routePath = VIEW_PATHS[view] || VIEW_PATHS.landing;
  if (APP_BASE_PATH === '/') return routePath;
  if (routePath === '/') return APP_BASE_PATH;
  return `${APP_BASE_PATH}${routePath}`;
}

function getAssetUrl(assetPath) {
  const normalizedAssetPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  if (APP_BASE_PATH === '/') {
    return `${SITE_ORIGIN}${normalizedAssetPath}`;
  }
  return `${SITE_ORIGIN}${APP_BASE_PATH}${normalizedAssetPath}`;
}

function getAbsoluteUrlForView(view) {
  return `${SITE_ORIGIN}${getPathForView(view)}`;
}

function setMetaTag(attr, key, content) {
  let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonicalLink(href) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

function setJsonLd(objects) {
  let scriptTag = document.head.querySelector('script#seo-jsonld');
  if (!scriptTag) {
    scriptTag = document.createElement('script');
    scriptTag.setAttribute('id', 'seo-jsonld');
    scriptTag.setAttribute('type', 'application/ld+json');
    document.head.appendChild(scriptTag);
  }
  scriptTag.textContent = JSON.stringify(objects);
}

function buildSeoJsonLd(view, seo) {
  const canonicalUrl = getAbsoluteUrlForView(view);
  const homeUrl = getAbsoluteUrlForView('landing');
  const breadcrumbItems = [
    { position: 1, name: 'Home', item: homeUrl },
  ];

  if (view !== 'landing') {
    breadcrumbItems.push({ position: 2, name: seo.title, item: canonicalUrl });
  }

  const objects = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${homeUrl}#website`,
      name: SITE_NAME,
      url: homeUrl,
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': seo.type,
      '@id': `${canonicalUrl}#webpage`,
      name: seo.title,
      description: seo.description,
      url: canonicalUrl,
      isPartOf: {
        '@id': `${homeUrl}#website`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbItems.map((item) => ({
        '@type': 'ListItem',
        position: item.position,
        name: item.name,
        item: item.item,
      })),
    },
  ];

  if (seo.faq?.length) {
    objects.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: seo.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  return objects;
}

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
  const [currentView, setCurrentView] = useState(() =>
    getViewFromPath(window.location.pathname),
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const debounceTimer = useRef(null);
  const mobileNavRef = useRef(null);
  const mobileToggleRef = useRef(null);

  const navigateToView = useCallback((view, options = {}) => {
    const { replace = false } = options;
    const targetPath = getPathForView(view);
    const currentPath = normalizePath(window.location.pathname);

    if (currentPath !== targetPath) {
      const historyAction = replace
        ? window.history.replaceState
        : window.history.pushState;
      historyAction.call(window.history, { view }, '', targetPath);
    }

    setCurrentView(view);
  }, []);

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
    )
      .then((summary) => {
        if (!cancelled && summary) {
          setCacheSummary(summary);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsHydratingStats(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep UI state in sync with browser path and back/forward navigation.
  useEffect(() => {
    const normalizedPath = normalizePath(window.location.pathname);
    const inferredView = getViewFromPath(normalizedPath);

    setCurrentView(inferredView);

    if (
      normalizedPath !== getPathForView('landing') &&
      normalizedPath !== getPathForView('templates') &&
      normalizedPath !== getPathForView('book') &&
      normalizedPath !== getPathForView('setup')
    ) {
      navigateToView('landing', { replace: true });
    }

    const handlePopState = () => {
      setCurrentView(getViewFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [navigateToView]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const onPointerDown = (event) => {
      const navEl = mobileNavRef.current;
      const toggleEl = mobileToggleRef.current;
      const target = event.target;

      if (navEl?.contains(target) || toggleEl?.contains(target)) return;
      setIsMobileMenuOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (mobileNavRef.current) {
      mobileNavRef.current.scrollTop = 0;
    }
    document.body.classList.add('mobile-menu-open');
    document.documentElement.classList.add('mobile-menu-open');
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('mobile-menu-open');
      document.documentElement.classList.remove('mobile-menu-open');
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const seo = VIEW_SEO[currentView] || VIEW_SEO.landing;
    const canonicalUrl = getAbsoluteUrlForView(currentView);

    document.title = seo.title;
    setCanonicalLink(canonicalUrl);
    setMetaTag('name', 'description', seo.description);
    setMetaTag('name', 'robots', 'index,follow');

    setMetaTag('property', 'og:site_name', SITE_NAME);
    setMetaTag('property', 'og:title', seo.title);
    setMetaTag('property', 'og:description', seo.description);
    setMetaTag('property', 'og:type', 'website');
    setMetaTag('property', 'og:url', canonicalUrl);
    setMetaTag('property', 'og:image', SOCIAL_IMAGE_URL);

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', seo.title);
    setMetaTag('name', 'twitter:description', seo.description);
    setMetaTag('name', 'twitter:image', SOCIAL_IMAGE_URL);

    setJsonLd(buildSeoJsonLd(currentView, seo));
  }, [currentView]);

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
          <div
            className="header-brand"
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigateToView('landing');
            }}
          >
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

          <button
            type="button"
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'is-open' : ''}`}
            ref={mobileToggleRef}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="site-navigation"
          >
            <span />
            <span />
            <span />
          </button>

          <nav
            className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}
            id="site-navigation"
            ref={mobileNavRef}
          >
            <a
              className={`nav-link ${currentView === 'templates' ? 'active' : ''}`}
              href={getPathForView('templates')}
              onClick={(event) => {
                event.preventDefault();
                setIsMobileMenuOpen(false);
                navigateToView('templates');
              }}
            >
              Templates Gallery
            </a>
            <a
              className={`nav-link ${currentView === 'book' ? 'active' : ''}`}
              href={getPathForView('book')}
              onClick={(event) => {
                event.preventDefault();
                setIsMobileMenuOpen(false);
                navigateToView('book');
              }}
              id="profile-book-nav"
            >
              Profile Book
            </a>
            <a
              className={`nav-link ${currentView === 'setup' ? 'active' : ''}`}
              href={getPathForView('setup')}
              onClick={(event) => {
                event.preventDefault();
                setIsMobileMenuOpen(false);
                navigateToView('setup');
              }}
            >
              Setup GitHub Pages
            </a>
            <a
              className="github-link"
              href="https://github.com/Dipen-Dedania/awesome-github-profile-website"
              target="_blank"
              rel="noopener noreferrer"
              id="github-repo-link"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              ⭐ Star on GitHub
            </a>
          </nav>
        </div>
        <button
          type="button"
          className={`mobile-nav-overlay ${isMobileMenuOpen ? 'is-open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden={!isMobileMenuOpen}
          tabIndex={isMobileMenuOpen ? 0 : -1}
        />
      </header>

      <main className="container">
        {currentView === 'landing' ? (
          <LandingSection
            profiles={profiles}
            repoStatsMap={repoStatsMap}
            userStatsMap={userStatsMap}
            isHydratingStats={isHydratingStats}
            onBrowseTemplates={() => navigateToView('templates')}
          />
        ) : currentView === 'book' ? (
          <ProfileBook
            profiles={profiles}
            repoStatsMap={repoStatsMap}
            userStatsMap={userStatsMap}
            isHydratingStats={isHydratingStats}
          />
        ) : currentView === 'setup' ? (
          <SetupGuide onBrowseTemplates={() => navigateToView('templates')} />
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
            <FaqSection
              title="Templates Gallery FAQs"
              items={TEMPLATES_FAQ_ITEMS}
            />
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
