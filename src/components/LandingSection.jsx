import React, { useMemo } from 'react';
import ProfileCard from './ProfileCard.jsx';
import ScreenshotGallery from './ScreenshotGallery.jsx';

export default function LandingSection({
  profiles,
  repoStatsMap,
  userStatsMap,
  isHydratingStats,
  onBrowseTemplates,
}) {
  const topProfiles = useMemo(() => {
    const profilesWithStars = profiles.map((p) => ({
      ...p,
      stars: repoStatsMap[p.id]?.stars || 0,
    }));

    profilesWithStars.sort((a, b) => b.stars - a.stars);
    return profilesWithStars.slice(0, 3);
  }, [profiles, repoStatsMap]);

  return (
    <div className="landing-content animation-fade-in">
      <section className="hero-section">
        <div className="hero-video-wrapper">
          <video
            className="hero-video-bg"
            autoPlay
            loop
            muted
            playsInline
            src={`${import.meta.env.BASE_URL}hero.mp4`}
          />
          <div className="hero-video-overlay" />
        </div>

        <h1 className="hero-title">
          Your GitHub Profile is
          <br />
          your New Resume<span className="hero-dot">.</span>
        </h1>
        <p className="hero-subtitle">
          Stop sending static PDFs. Showcase your code, contributions, and
          personality with a high-performance profile website.
        </p>

        <div className="cta-banner">
          <div className="cta-banner-text">
            Choose from 50+ Professionally Designed Templates
          </div>
          <button className="btn-primary" onClick={onBrowseTemplates}>
            BROWSE TEMPLATES &mdash; IT&apos;S FREE
          </button>
        </div>
      </section>

      <ScreenshotGallery />

      <section className="featured-section">
        <h2 className="featured-heading">
          <span className="featured-icon">⭐</span> Top Featured Profiles
        </h2>
        <div className="gallery-grid">
          {topProfiles.map((profile) => (
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
          ))}
        </div>
      </section>
    </div>
  );
}
