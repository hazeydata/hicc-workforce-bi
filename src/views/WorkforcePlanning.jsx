import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import LollipopBar from '../components/LollipopBar';
import Badge from '../components/Badge';
import { filterPositions } from '../utils/filters';
import { CHART_COLORS } from '../theme';
import { ORG_HIERARCHY } from '../data/generateData';

const REF_DATE = '2026-02-19';
const TWELVE_MONTHS_MS = 365 * 24 * 60 * 60 * 1000;

function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function isWithinDays(dateStr, days) {
  const d = parseDate(dateStr);
  if (!d) return false;
  const ref = new Date(REF_DATE);
  return d >= ref && d <= new Date(ref.getTime() + days * 24 * 60 * 60 * 1000);
}

export default function WorkforcePlanning({ positions, filters }) {
  const filteredPositions = useMemo(
    () => filterPositions(positions, filters),
    [positions, filters]
  );

  const occupied = filteredPositions.filter(p => p.occupancyStatus !== 'Vacant');

  const dirNameMap = useMemo(() => {
    const m = {};
    ORG_HIERARCHY.forEach(r => { m[r.directorateCode] = r.directorateName; });
    return m;
  }, []);

  const tenureData = useMemo(() => {
    const m = {};
    occupied.forEach(p => {
      const t = p.tenureType || 'Unknown';
      m[t] = (m[t] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [occupied]);

  const regionData = useMemo(() => {
    const m = {};
    filteredPositions.forEach(p => {
      const r = p.location?.region ?? 'Unknown';
      m[r] = (m[r] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredPositions]);

  const languageData = useMemo(() => {
    const m = {};
    filteredPositions.forEach(p => {
      const l = p.languageProfile || 'Unknown';
      m[l] = (m[l] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredPositions]);

  const totalCritical = filteredPositions.filter(p => p.isCritical).length;
  const criticalVacant = filteredPositions.filter(p => p.isCritical && p.occupancyStatus === 'Vacant').length;
  const criticalFilled = totalCritical - criticalVacant;

  const termsEnding12Mo = filteredPositions
    .filter(p => p.endDate && isWithinDays(p.endDate, 365))
    .sort((a, b) => (a.endDate || '').localeCompare(b.endDate || ''))
    .slice(0, 30);

  const sunsetPositions = filteredPositions
    .filter(p => p.fundingSource === 'Sunset')
    .sort((a, b) => (a.fundingSunsetDate || '').localeCompare(b.fundingSunsetDate || ''))
    .slice(0, 30);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontFamily: 'Rubik', fontWeight: 400, fontSize: '1.75em', marginBottom: 24 }}>
        Workforce Planning
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Workforce by Tenure Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={tenureData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {tenureData.map((entry, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Geographic Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={regionData} margin={{ top: 20, right: 24, left: 0, bottom: 5 }} barSize={28} barCategoryGap="40%" barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, (Math.max(...regionData.map(d => d.value), 0) || 1) * 1.1]} />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_COLORS[0]} shape={(p) => <LollipopBar {...p} dataKey="value" format="number" />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Language Profile Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={languageData} margin={{ top: 20, right: 24, left: 0, bottom: 5 }} barSize={28} barCategoryGap="40%" barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, (Math.max(...languageData.map(d => d.value), 0) || 1) * 1.1]} />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_COLORS[1]} shape={(p) => <LollipopBar {...p} dataKey="value" format="number" />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Critical Positions Summary</h3>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'center', height: 180 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Rubik', fontWeight: 700, fontSize: 36, color: '#252525' }}>{totalCritical}</div>
              <div style={{ fontFamily: 'Nunito Sans', fontSize: 13, color: '#666666' }}>Total Critical</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Rubik', fontWeight: 700, fontSize: 36, color: '#AF3C43' }}>{criticalVacant}</div>
              <div style={{ fontFamily: 'Nunito Sans', fontSize: 13, color: '#666666' }}>Critical & Vacant</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Rubik', fontWeight: 700, fontSize: 36, color: '#92CC6F' }}>{criticalFilled}</div>
              <div style={{ fontFamily: 'Nunito Sans', fontSize: 13, color: '#666666' }}>Critical & Filled</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, margin: 16, marginBottom: 8 }}>Terms & Temporary Staff Ending Within 12 Months</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Nunito Sans' }}>
            <thead>
              <tr style={{ background: '#F3F8FA', borderBottom: '2px solid #CECECE' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>Position</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Classification</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Incumbent</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Tenure Type</th>
                <th style={{ padding: 10, textAlign: 'left' }}>End Date</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Directorate</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Funding</th>
              </tr>
            </thead>
            <tbody>
              {termsEnding12Mo.map((row, i) => (
                <tr key={row.positionId} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FA' }}>
                  <td style={{ padding: 10 }}>{row.positionId}</td>
                  <td style={{ padding: 10 }}>{row.classification}</td>
                  <td style={{ padding: 10 }}>{row.incumbentName ?? '—'}</td>
                  <td style={{ padding: 10 }}>{row.tenureType ?? '—'}</td>
                  <td style={{ padding: 10, color: '#FEC04F' }}>{row.endDate ?? '—'}</td>
                  <td style={{ padding: 10 }}>{dirNameMap[row.directorateCode] || row.directorateCode}</td>
                  <td style={{ padding: 10 }}>
                    <Badge variant={row.fundingSource === 'Sunset' ? 'sunset' : 'aBase'}>{row.fundingSource}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, margin: 16, marginBottom: 8 }}>Sunset Funding Positions</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Nunito Sans' }}>
            <thead>
              <tr style={{ background: '#F3F8FA', borderBottom: '2px solid #CECECE' }}>
                <th style={{ padding: 10, textAlign: 'left' }}>Position</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Classification</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Incumbent</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Sunset Date</th>
                <th style={{ padding: 10, textAlign: 'left' }}>Directorate</th>
              </tr>
            </thead>
            <tbody>
              {sunsetPositions.map((row, i) => (
                <tr key={row.positionId} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FA' }}>
                  <td style={{ padding: 10 }}>{row.positionId}</td>
                  <td style={{ padding: 10 }}>{row.classification}</td>
                  <td style={{ padding: 10 }}>
                    <Badge variant={row.occupancyStatus === 'Vacant' ? 'vacant' : 'occupied'}>{row.occupancyStatus}</Badge>
                  </td>
                  <td style={{ padding: 10 }}>{row.incumbentName ?? '—'}</td>
                  <td style={{ padding: 10, color: '#AF3C43' }}>{row.fundingSunsetDate ?? '—'}</td>
                  <td style={{ padding: 10 }}>{dirNameMap[row.directorateCode] || row.directorateCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
