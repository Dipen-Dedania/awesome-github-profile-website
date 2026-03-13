export default function StatsBar({ profiles, repoStatsMap }) {
  const totalProfiles = profiles.length;
  const personalCount = profiles.filter((p) => p.type === 'personal').length;
  const templateCount = profiles.filter((p) => p.type === 'template').length;

  let totalStars = 0;
  const langCount = {};

  for (const p of profiles) {
    const stats = repoStatsMap[p.id];
    if (!stats) continue;
    totalStars += stats.stars || 0;
    if (stats.language) {
      langCount[stats.language] = (langCount[stats.language] || 0) + 1;
    }
  }

  const topLanguage =
    Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  return (
    <div className="stats-bar" id="stats-bar">
      <div className="stat-pill">
        <span className="stat-icon">📦</span>
        <span className="stat-value">{totalProfiles}</span> profiles
      </div>
      <div className="stat-pill">
        <span className="stat-icon">👤</span>
        <span className="stat-value">{personalCount}</span> personal
      </div>
      <div className="stat-pill">
        <span className="stat-icon">📄</span>
        <span className="stat-value">{templateCount}</span> templates
      </div>
      <div className="stat-pill">
        <span className="stat-icon">⭐</span>
        <span className="stat-value">{totalStars.toLocaleString()}</span> total
        stars
      </div>
      <div className="stat-pill">
        <span className="stat-icon">💻</span>
        Top language: <span className="stat-value">{topLanguage}</span>
      </div>
    </div>
  );
}
