import React from 'react';
import { screenshots } from '../screenshots-list.js';

export default function ScreenshotGallery() {
  // Split screenshots into 3 roughly equal rows
  const row1 = screenshots.slice(0, Math.ceil(screenshots.length / 3));
  const row2 = screenshots.slice(Math.ceil(screenshots.length / 3), Math.ceil(screenshots.length * 2 / 3));
  const row3 = screenshots.slice(Math.ceil(screenshots.length * 2 / 3));

  const MarqueeRow = ({ items, reverse }) => (
    <div className={`marquee-row ${reverse ? 'marquee-reverse' : ''}`}>
      <div className="marquee-content">
        {/* Render twice for continuous scrolling */}
        {[...items, ...items].map((item, i) => {
          const username = item.replace('.png', '');
          return (
            <div key={`${username}-${i}`} className="marquee-item">
              <div className="screenshot-wrapper">
                <img 
                  src={`${import.meta.env.BASE_URL}screenshots/${item}`} 
                  alt={`${username} profile preview`} 
                  loading="lazy" 
                  className="screenshot-img"
                />
                <div className="screenshot-overlay">
                  <div className="screenshot-info">
                    <span className="screenshot-username">@{username}</span>
                    <a 
                      href={`https://github.com/${username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="screenshot-link-btn"
                    >
                      View GitHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="screenshot-gallery-section">
      <div className="gallery-header container">
        <h2 className="section-title">
          <span className="title-gradient">Community Showcases</span>
        </h2>
        <p className="section-subtitle">
          Discover hand-crafted portfolios and profiles deployed by developers worldwide.
        </p>
      </div>

      <div className="marquee-container">
        <div className="marquee-fade marquee-fade-left"></div>
        <div className="marquee-fade marquee-fade-right"></div>
        
        <MarqueeRow items={row1} reverse={false} />
        <MarqueeRow items={row2} reverse={true} />
        <MarqueeRow items={row3} reverse={false} />
      </div>
    </section>
  );
}
