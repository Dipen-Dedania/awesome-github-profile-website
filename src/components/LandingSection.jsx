import React, { useMemo } from 'react';
import ProfileCard from './ProfileCard.jsx';
import ScreenshotGallery from './ScreenshotGallery.jsx';
import FaqSection from './FaqSection.jsx';

const LANDING_FAQ_ITEMS = [
  {
    question: 'Why should developers build a GitHub profile website?',
    answer:
      'A GitHub profile website gives you a public portfolio that shows projects, code quality, and personality beyond a static resume.',
  },
  {
    question: 'Can beginners use these portfolio examples?',
    answer:
      'Yes. Many examples are beginner-friendly and can be customized quickly with your own bio, projects, and links.',
  },
  {
    question: 'What should a strong portfolio homepage include?',
    answer:
      'Start with a clear introduction, top projects, tech stack, and direct links to contact, GitHub, and live demos.',
  },
];

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
            src={`${import.meta.env.BASE_URL}hero-v2.mp4`}
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

      <FaqSection title="Portfolio Website FAQs" items={LANDING_FAQ_ITEMS} />
    </div>
  );
}
