import { BRANCHES } from '../data/generateData';
import { getDirectoratesForBranch, getDivisionsForDirectorate } from '../utils/filters';

const TABS = [
  { id: 'executive', label: 'Executive Summary' },
  { id: 'positions', label: 'Position Explorer' },
  { id: 'financial', label: 'Financial Overview' },
  { id: 'workforce', label: 'Workforce Planning' },
  { id: 'scenario', label: 'Scenario Planning', disabled: true }, // Future feature
  { id: 'equity', label: 'Employment Equity' },
];

export default function Header({
  activeTab,
  onTabChange,
  filters: { branch, directorate, division },
  onFilterChange,
  onClearFilters,
}) {
  const directorates = getDirectoratesForBranch(branch);
  const divisions = getDivisionsForDirectorate(branch, directorate);
  const hasFilters = branch || directorate || division;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: '#FFFFFF',
        borderBottom: '1px solid #CECECE',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ padding: '16px 24px' }}>
        <h1
          style={{
            fontFamily: 'Rubik',
            fontWeight: 300,
            fontSize: '1.75em',
            color: '#002D42',
            margin: '0 0 4px 0',
          }}
        >
          Housing, Infrastructure and Communities Canada
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: '#666666' }}>
          Logement, Infrastructure et Collectivités Canada
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 24px',
          background: '#F3F8FA',
          borderTop: '1px solid #E0E0E0',
          flexWrap: 'wrap',
        }}
      >
        <select
          value={branch || ''}
          onChange={e => {
            onFilterChange({ branch: e.target.value || null, directorate: null, division: null });
          }}
          style={{
            border: '1px solid #CECECE',
            borderRadius: 4,
            padding: '8px 12px',
            fontSize: 14,
            fontFamily: 'Nunito Sans',
            minWidth: 140,
          }}
          aria-label="Filter by Branch"
        >
          <option value="">All Branches</option>
          {BRANCHES.map(b => (
            <option key={b.branchCode} value={b.branchCode}>
              {b.branchCode} — {b.branchName}
            </option>
          ))}
        </select>

        <select
          value={directorate || ''}
          onChange={e => onFilterChange({ directorate: e.target.value || null, division: null })}
          disabled={!branch}
          style={{
            border: '1px solid #CECECE',
            borderRadius: 4,
            padding: '8px 12px',
            fontSize: 14,
            fontFamily: 'Nunito Sans',
            minWidth: 180,
            opacity: branch ? 1 : 0.6,
          }}
          aria-label="Filter by Directorate"
        >
          <option value="">All Directorates</option>
          {directorates.map(d => (
            <option key={d.code} value={d.code}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={division || ''}
          onChange={e => onFilterChange({ division: e.target.value || null })}
          disabled={!directorate}
          style={{
            border: '1px solid #CECECE',
            borderRadius: 4,
            padding: '8px 12px',
            fontSize: 14,
            fontFamily: 'Nunito Sans',
            minWidth: 200,
            opacity: directorate ? 1 : 0.6,
          }}
          aria-label="Filter by Division"
        >
          <option value="">All Divisions</option>
          {divisions.map((d, i) => (
            <option key={i} value={`${directorate}-${String(i + 1).padStart(2, '0')}`}>
              {d}
            </option>
          ))}
        </select>

        <span style={{ fontSize: 14, color: '#666666', marginLeft: 'auto' }}>
          Last Refreshed: 2/19/2026
        </span>

        {hasFilters && (
          <button
            onClick={onClearFilters}
            style={{
              background: '#FFFFFF',
              border: '1px solid #002D42',
              color: '#002D42',
              borderRadius: 4,
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Nunito Sans',
              cursor: 'pointer',
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      <nav
        style={{
          display: 'flex',
          gap: 0,
          padding: '0 24px',
          borderTop: '1px solid #E0E0E0',
          flexWrap: 'wrap',
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            style={{
              background: activeTab === tab.id ? '#002D42' : 'transparent',
              color: tab.disabled ? '#999999' : activeTab === tab.id ? '#FFFFFF' : '#252525',
              border: 'none',
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Nunito Sans',
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              borderBottom: activeTab === tab.id ? '3px solid #137991' : '3px solid transparent',
              opacity: tab.disabled ? 0.7 : 1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
