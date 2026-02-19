import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import KPICard from '../components/KPICard';
import Badge from '../components/Badge';
import { fmt } from '../utils/formatters';
import { filterPositions } from '../utils/filters';
import { BRANCHES } from '../data/generateData';
import { CHART_COLORS } from '../theme';

function getPriorityTier(p) {
  if (p.isCritical) return 4;
  if (p.occupancyStatus === 'Vacant') return 0;
  if (p.fundingSource === 'Sunset') return 1;
  if (['Term', 'Casual', 'Student', 'Assignment', 'Secondment'].includes(p.tenureType)) return 2;
  return 3;
}

export default function ScenarioPlanning({ positions, filters }) {
  const [reductionPct, setReductionPct] = useState(5);
  const [targetBranch, setTargetBranch] = useState('');

  const filteredPositions = useMemo(
    () => filterPositions(positions, filters),
    [positions, filters]
  );

  const occupiedPool = useMemo(() => {
    let pool = filteredPositions.filter(p => p.occupancyStatus !== 'Vacant');
    if (targetBranch) pool = pool.filter(p => p.branchCode === targetBranch);
    return pool;
  }, [filteredPositions, targetBranch]);

  const affectedPositions = useMemo(() => {
    const sorted = [...occupiedPool].sort((a, b) => {
      const ta = getPriorityTier(a);
      const tb = getPriorityTier(b);
      if (ta !== tb) return ta - tb;
      return (a.salary || 0) - (b.salary || 0);
    });
    const n = Math.ceil(occupiedPool.length * (reductionPct / 100));
    return sorted.slice(0, n);
  }, [occupiedPool, reductionPct]);

  const salarySavings = affectedPositions.reduce((s, p) => s + (p.salary || 0), 0);
  const criticalImpacted = affectedPositions.filter(p => p.isCritical).length;
  const indeterminateImpacted = affectedPositions.filter(p => p.tenureType === 'Indeterminate').length;

  const byBranch = useMemo(() => {
    const m = {};
    affectedPositions.forEach(p => {
      m[p.branchCode] = (m[p.branchCode] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [affectedPositions]);

  const byClassification = useMemo(() => {
    const m = {};
    affectedPositions.forEach(p => {
      m[p.classificationGroup] = (m[p.classificationGroup] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [affectedPositions]);

  const displayTable = affectedPositions.slice(0, 50);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontFamily: 'Rubik', fontWeight: 400, fontSize: '1.75em', marginBottom: 24 }}>
        Scenario Planning
      </h2>

      <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Controls</h3>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Reduction Target: {reductionPct}%</label>
            <input
              type="range"
              min={1}
              max={30}
              value={reductionPct}
              onChange={e => setReductionPct(Number(e.target.value))}
              style={{ width: 200 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>Target Branch</label>
            <select
              value={targetBranch}
              onChange={e => setTargetBranch(e.target.value)}
              style={{ border: '1px solid #CECECE', borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 180 }}
            >
              <option value="">All Branches</option>
              {BRANCHES.map(b => (
                <option key={b.branchCode} value={b.branchCode}>{b.branchName}</option>
              ))}
            </select>
          </div>
        </div>
        <p style={{ fontSize: 14, color: '#666666', marginTop: 12, maxWidth: 600 }}>
          Model workforce reduction scenarios. The algorithm prioritizes non-critical sunset-funded and temporary positions first, protecting critical and indeterminate roles.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard
          label="Positions Affected"
          value={affectedPositions.length}
          accentColor="#AF3C43"
          valueColor="#AF3C43"
        />
        <KPICard
          label="Salary Savings"
          value={fmt(salarySavings)}
          accentColor="#FEC04F"
        />
        <KPICard
          label="Critical Positions Impacted"
          value={criticalImpacted}
          accentColor={criticalImpacted > 0 ? '#AF3C43' : '#92CC6F'}
          valueColor={criticalImpacted > 0 ? '#AF3C43' : '#92CC6F'}
        />
        <KPICard
          label="Indeterminate Impacted"
          value={indeterminateImpacted}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Impact by Branch</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byBranch}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_COLORS[7]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Impact by Classification</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byClassification}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_COLORS[5]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, margin: 16, marginBottom: 8 }}>Affected Positions Detail</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Nunito Sans' }}>
          <thead>
            <tr style={{ background: '#F3F8FA', borderBottom: '2px solid #CECECE' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Position</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Classification</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Incumbent</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Tenure</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Funding</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Critical</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Salary</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Branch</th>
            </tr>
          </thead>
          <tbody>
            {displayTable.map((row, i) => (
              <tr key={row.positionId} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FA' }}>
                <td style={{ padding: 10 }}>{row.positionId}</td>
                <td style={{ padding: 10 }}>{row.classification}</td>
                <td style={{ padding: 10 }}>{row.incumbentName ?? '—'}</td>
                <td style={{ padding: 10 }}>{row.tenureType ?? '—'}</td>
                <td style={{ padding: 10 }}>
                  <Badge variant={row.fundingSource === 'Sunset' ? 'sunset' : 'aBase'}>{row.fundingSource}</Badge>
                </td>
                <td style={{ padding: 10 }}>
                  {row.isCritical ? <Badge variant="vacant">Critical</Badge> : '—'}
                </td>
                <td style={{ padding: 10, textAlign: 'right' }}>{fmt(row.salary)}</td>
                <td style={{ padding: 10 }}>{row.branchCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
