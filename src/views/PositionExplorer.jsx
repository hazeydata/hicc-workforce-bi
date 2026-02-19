import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import KPICard from '../components/KPICard';
import Badge from '../components/Badge';
import { fmt } from '../utils/formatters';
import { filterPositions } from '../utils/filters';
import { CLASSIFICATION_GROUPS, BRANCHES } from '../data/generateData';
import { CHART_COLORS } from '../theme';

const PAGE_SIZE = 50;

export default function PositionExplorer({ positions, filters }) {
  const [search, setSearch] = useState('');
  const [occupancyFilter, setOccupancyFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');
  const [fundingFilter, setFundingFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [sortKey, setSortKey] = useState('positionId');
  const [sortDir, setSortDir] = useState(1);
  const [page, setPage] = useState(1);

  const filteredPositions = useMemo(() => {
    let result = filterPositions(positions, filters);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        p =>
          (p.positionId && p.positionId.toLowerCase().includes(q)) ||
          (p.positionTitle && p.positionTitle.toLowerCase().includes(q)) ||
          (p.incumbentName && p.incumbentName.toLowerCase().includes(q)) ||
          (p.classification && p.classification.toLowerCase().includes(q))
      );
    }
    if (occupancyFilter) {
      result = result.filter(p => p.occupancyStatus === occupancyFilter);
    }
    if (classificationFilter) {
      result = result.filter(p => p.classificationGroup === classificationFilter);
    }
    if (fundingFilter) {
      result = result.filter(p => p.fundingSource === fundingFilter);
    }
    if (branchFilter) {
      result = result.filter(p => p.branchCode === branchFilter);
    }
    return result;
  }, [positions, filters, search, occupancyFilter, classificationFilter, fundingFilter, branchFilter]);

  const occupied = filteredPositions.filter(p => p.occupancyStatus !== 'Vacant');
  const vacant = filteredPositions.filter(p => p.occupancyStatus === 'Vacant');
  const totalSalary = useMemo(
    () => filteredPositions.reduce((s, p) => s + (p.salary || 0), 0),
    [filteredPositions]
  );

  const classificationByGroup = useMemo(() => {
    const m = {};
    filteredPositions.forEach(p => {
      m[p.classificationGroup] = (m[p.classificationGroup] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredPositions]);

  const fundingBySource = useMemo(() => {
    const m = {};
    filteredPositions.forEach(p => {
      m[p.fundingSource] = (m[p.fundingSource] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [filteredPositions]);

  const fundingColors = { 'A-Base': CHART_COLORS[1], 'B-Base': CHART_COLORS[8], 'Program': CHART_COLORS[3], 'Sunset': CHART_COLORS[7] };

  const sorted = useMemo(() => {
    const arr = [...filteredPositions];
    arr.sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (typeof va === 'string') va = va ?? '';
      if (typeof vb === 'string') vb = vb ?? '';
      if (typeof va === 'number' && typeof vb === 'number') return sortDir * (va - vb);
      return sortDir * String(va).localeCompare(String(vb));
    });
    return arr;
  }, [filteredPositions, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE) || 1;
  const start = (page - 1) * PAGE_SIZE;
  const pageData = sorted.slice(start, start + PAGE_SIZE);

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(1); }
    setPage(1);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontFamily: 'Rubik', fontWeight: 400, fontSize: '1.75em', marginBottom: 24 }}>
        Position Explorer
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard label="Filtered Positions" value={filteredPositions.length} />
        <KPICard label="Occupied" value={occupied.length} accentColor="#92CC6F" />
        <KPICard label="Vacant" value={vacant.length} accentColor="#AF3C43" />
        <KPICard label="Total Salary Cost" value={fmt(totalSalary)} />

      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Search position ID, title, incumbent, classification..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{
            border: '1px solid #CECECE',
            borderRadius: 4,
            padding: '8px 12px',
            fontSize: 14,
            fontFamily: 'Nunito Sans',
            minWidth: 280,
          }}
        />
        <select
          value={occupancyFilter}
          onChange={e => { setOccupancyFilter(e.target.value); setPage(1); }}
          style={{ border: '1px solid #CECECE', borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 140 }}
        >
          <option value="">All Status</option>
          <option value="Occupied">Occupied</option>
          <option value="Vacant">Vacant</option>
          <option value="Occupied - Acting">Acting</option>
        </select>
        <select
          value={classificationFilter}
          onChange={e => { setClassificationFilter(e.target.value); setPage(1); }}
          style={{ border: '1px solid #CECECE', borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 140 }}
        >
          <option value="">All Classifications</option>
          {CLASSIFICATION_GROUPS.map(g => (
            <option key={g.code} value={g.code}>{g.code}</option>
          ))}
        </select>
        <select
          value={fundingFilter}
          onChange={e => { setFundingFilter(e.target.value); setPage(1); }}
          style={{ border: '1px solid #CECECE', borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 120 }}
        >
          <option value="">All Funding</option>
          <option value="A-Base">A-Base</option>
          <option value="B-Base">B-Base</option>
          <option value="Program">Program</option>
          <option value="Sunset">Sunset</option>
        </select>
        <select
          value={branchFilter}
          onChange={e => { setBranchFilter(e.target.value); setPage(1); }}
          style={{ border: '1px solid #CECECE', borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 120 }}
        >
          <option value="">All Branches</option>
          {BRANCHES.map(b => (
            <option key={b.branchCode} value={b.branchCode}>{b.branchCode}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Distribution by Classification</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={classificationByGroup} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={40} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Funding Source Mix</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={fundingBySource}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {fundingBySource.map((entry, i) => (
                  <Cell key={i} fill={fundingColors[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Nunito Sans' }}>
          <thead>
            <tr style={{ background: '#F3F8FA', borderBottom: '2px solid #CECECE' }}>
              {[
                ['positionId', 'Position ID'],
                ['classification', 'Classification'],
                ['positionTitle', 'Title'],
                ['occupancyStatus', 'Status'],
                ['incumbentName', 'Incumbent'],
                ['tenureType', 'Tenure'],
                ['fundingSource', 'Funding'],
                ['languageProfile', 'Language'],
                ['location', 'Location'],
                ['salary', 'Salary'],
              ].map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  style={{
                    padding: 12,
                    textAlign: key === 'salary' ? 'right' : 'left',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {label} {sortKey === key && (sortDir === 1 ? '↑' : '↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={row.positionId} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FA' }}>
                <td style={{ padding: 10, fontFamily: 'monospace' }}>{row.positionId}</td>
                <td style={{ padding: 10 }}><Badge variant="default">{row.classification}</Badge></td>
                <td style={{ padding: 10 }}>{row.positionTitle}</td>
                <td style={{ padding: 10 }}>
                  <Badge
                    variant={
                      row.occupancyStatus === 'Occupied' ? 'occupied' :
                      row.occupancyStatus === 'Vacant' ? 'vacant' : 'acting'
                    }
                  >
                    {row.occupancyStatus}
                  </Badge>
                </td>
                <td style={{ padding: 10 }}>{row.incumbentName ?? '—'}</td>
                <td style={{ padding: 10 }}>{row.tenureType ?? '—'}</td>
                <td style={{ padding: 10 }}>
                  <Badge
                    variant={
                      row.fundingSource === 'A-Base' ? 'aBase' :
                      row.fundingSource === 'B-Base' ? 'bBase' :
                      row.fundingSource === 'Program' ? 'program' : 'sunset'
                    }
                  >
                    {row.fundingSource}
                  </Badge>
                </td>
                <td style={{ padding: 10 }}>{row.languageProfile}</td>
                <td style={{ padding: 10 }}>{row.location?.city ?? '—'}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>{fmt(row.salary)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTop: '1px solid #E0E0E0' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              background: '#FFFFFF',
              border: '1px solid #002D42',
              color: '#002D42',
              borderRadius: 4,
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Nunito Sans',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.5 : 1,
            }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 14, color: '#666666' }}>
            Page {page} of {totalPages} ({filteredPositions.length} positions)
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{
              background: '#FFFFFF',
              border: '1px solid #002D42',
              color: '#002D42',
              borderRadius: 4,
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Nunito Sans',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages ? 0.5 : 1,
            }}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
