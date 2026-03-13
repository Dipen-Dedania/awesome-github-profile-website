export default function Filters({
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  sort,
  onSortChange,
}) {
  const types = ['all', 'personal', 'template'];

  return (
    <div className="filters-row" id="filters">
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          id="search-input"
          className="search-input"
          type="text"
          placeholder="Search by name, author, language…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {types.map((t) => (
          <button
            key={t}
            id={`filter-${t}`}
            className={`filter-btn ${typeFilter === t ? 'active' : ''}`}
            onClick={() => onTypeChange(t)}
          >
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <select
        id="sort-select"
        className="sort-select"
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
      >
        <option value="name-asc">Name A→Z</option>
        <option value="name-desc">Name Z→A</option>
        <option value="stars-desc">Most starred</option>
        <option value="updated-desc">Recently updated</option>
      </select>
    </div>
  );
}
