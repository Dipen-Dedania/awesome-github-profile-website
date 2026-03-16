import React, { useMemo, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import ProfileCard from './ProfileCard.jsx';

export default function LandingSection({ profiles, repoStatsMap, userStatsMap, onBrowseTemplates }) {
  // Compute Top 4 featured profiles based on stars
  const topProfiles = useMemo(() => {
    const profilesWithStars = profiles.map(p => ({
      ...p,
      stars: repoStatsMap[p.id]?.stars || 0
    }));
    
    // Sort by stars descending
    profilesWithStars.sort((a, b) => b.stars - a.stars);
    
    // Return top 4
    return profilesWithStars.slice(0, 3);
  }, [profiles, repoStatsMap]);

  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // const src = '/awesome-github-profile-website/hero.mp4';
    const src = '/awesome-github-profile-website/hero-video.m3u8';
    const isHls = src.endsWith('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        capLevelToPlayerSize: true,
        startLevel: -1,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch((e) => console.warn('Autoplay prevented:', e));
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else hls.destroy();
        }
      });
      return () => hls.destroy();
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS (Safari)
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch((e) => console.warn('Autoplay prevented:', e));
      });
    } else {
      // Native format (MP4, WebM, etc.) — set src directly, skip HLS.js entirely
      video.src = src;
      video.play().catch((e) => console.warn('Autoplay prevented:', e));
    }
  }, []);

  return (
    <div className="landing-content animation-fade-in">
      {/* Hero Section */}
      <section className="hero-section">
        {/* Background Video */}
        <div className="hero-video-wrapper">
          <video 
            ref={videoRef}
            className="hero-video-bg"
            autoPlay 
            loop 
            muted 
            playsInline
          ></video>
          <div className="hero-video-overlay" />
        </div>

        <h1 className="hero-title">
          Your GitHub Profile is<br/>your New Resume<span className="hero-dot">.</span>
        </h1>
        <p className="hero-subtitle">
          Stop sending static PDFs. Showcase your code, contributions, and personality with a high-performance profile website.
        </p>

        <div className="cta-banner">
          <div className="cta-banner-text">
            Choose from 50+ Professionally Designed Templates
          </div>
          <button className="btn-primary" onClick={onBrowseTemplates}>
            BROWSE TEMPLATES &mdash; IT'S FREE
          </button>
        </div>
      </section>

      {/* Featured Profiles Section */}
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
              userStats={userStatsMap[profile.author]}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
