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
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import KPICard from '../components/KPICard';
import { filterPositions } from '../utils/filters';
import { CLASSIFICATION_GROUPS } from '../data/generateData';
import { CHART_COLORS } from '../theme';

const EE_TARGETS = {
  women: 48,
  visibleMinority: 22,
  indigenous: 5,
  disability: 9,
};

export default function EmploymentEquity({ positions, filters }) {
  const filteredPositions = useMemo(
    () => filterPositions(positions, filters),
    [positions, filters]
  );

  const occupied = filteredPositions.filter(p => p.occupancyStatus !== 'Vacant');
  const total = occupied.length;

  const womenCount = occupied.filter(p => p.ee_gender === 'Woman').length;
  const womenPct = total > 0 ? (womenCount / total) * 100 : 0;
  const vmCount = occupied.filter(p => p.ee_visibleMinority).length;
  const vmPct = total > 0 ? (vmCount / total) * 100 : 0;
  const indCount = occupied.filter(p => p.ee_indigenous).length;
  const indPct = total > 0 ? (indCount / total) * 100 : 0;
  const disCount = occupied.filter(p => p.ee_disability).length;
  const disPct = total > 0 ? (disCount / total) * 100 : 0;

  const genderData = useMemo(() => {
    const m = {};
    occupied.forEach(p => {
      const g = p.ee_gender || 'Prefer not to say';
      m[g] = (m[g] || 0) + 1;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  }, [occupied]);

  const eeByBranch = useMemo(() => {
    const byBranch = {};
    occupied.forEach(p => {
      const b = p.branchCode;
      if (!byBranch[b]) byBranch[b] = { branch: b, total: 0, women: 0, vm: 0, indigenous: 0, disability: 0 };
      byBranch[b].total++;
      if (p.ee_gender === 'Woman') byBranch[b].women++;
      if (p.ee_visibleMinority) byBranch[b].vm++;
      if (p.ee_indigenous) byBranch[b].indigenous++;
      if (p.ee_disability) byBranch[b].disability++;
    });
    return Object.values(byBranch).map(b => ({
      branch: b.branch,
      'Women %': b.total > 0 ? Number(((b.women / b.total) * 100).toFixed(1)) : 0,
      'VM %': b.total > 0 ? Number(((b.vm / b.total) * 100).toFixed(1)) : 0,
      'Indigenous %': b.total > 0 ? Number(((b.indigenous / b.total) * 100).toFixed(1)) : 0,
      'Disability %': b.total > 0 ? Number(((b.disability / b.total) * 100).toFixed(1)) : 0,
    }));
  }, [occupied]);

  const eeByClassification = useMemo(() => {
    return CLASSIFICATION_GROUPS.map(g => {
      const groupPos = occupied.filter(p => p.classificationGroup === g.code);
      const n = groupPos.length;
      const women = groupPos.filter(p => p.ee_gender === 'Woman').length;
      const vm = groupPos.filter(p => p.ee_visibleMinority).length;
      const ind = groupPos.filter(p => p.ee_indigenous).length;
      const dis = groupPos.filter(p => p.ee_disability).length;
      return {
        group: g.code,
        total: n,
        women,
        womenPct: n > 0 ? ((women / n) * 100).toFixed(1) : '—',
        vm,
        vmPct: n > 0 ? ((vm / n) * 100).toFixed(1) : '—',
        indigenous: ind,
        indPct: n > 0 ? ((ind / n) * 100).toFixed(1) : '—',
        disability: dis,
        disPct: n > 0 ? ((dis / n) * 100).toFixed(1) : '—',
      };
    }).filter(r => r.total > 0);
  }, [occupied]);

  const targetColor = (actual, target) => (actual >= target ? '#92CC6F' : '#AF3C43');

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontFamily: 'Rubik', fontWeight: 400, fontSize: '1.75em', marginBottom: 24 }}>
        Employment Equity
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard
          label="Gender — Women"
          value={`${womenPct.toFixed(1)}%`}
          subtitle={`${womenCount} of ${total} • Target ~${EE_TARGETS.women}%`}
          accentColor={targetColor(womenPct, EE_TARGETS.women)}
          valueColor={targetColor(womenPct, EE_TARGETS.women)}
        />
        <KPICard
          label="Visible Minorities"
          value={`${vmPct.toFixed(1)}%`}
          subtitle={`${vmCount} of ${total} • Target ~${EE_TARGETS.visibleMinority}%`}
          accentColor={targetColor(vmPct, EE_TARGETS.visibleMinority)}
          valueColor={targetColor(vmPct, EE_TARGETS.visibleMinority)}
        />
        <KPICard
          label="Indigenous Peoples"
          value={`${indPct.toFixed(1)}%`}
          subtitle={`${indCount} of ${total} • Target ~${EE_TARGETS.indigenous}%`}
          accentColor={targetColor(indPct, EE_TARGETS.indigenous)}
          valueColor={targetColor(indPct, EE_TARGETS.indigenous)}
        />
        <KPICard
          label="Persons with Disabilities"
          value={`${disPct.toFixed(1)}%`}
          subtitle={`${disCount} of ${total} • Target ~${EE_TARGETS.disability}%`}
          accentColor={targetColor(disPct, EE_TARGETS.disability)}
          valueColor={targetColor(disPct, EE_TARGETS.disability)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {genderData.map((entry, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>EE Representation by Branch</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={eeByBranch} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="branch" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 60]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Women %" fill={CHART_COLORS[0]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="VM %" fill={CHART_COLORS[1]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Indigenous %" fill={CHART_COLORS[2]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="Disability %" fill={CHART_COLORS[3]} radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' }}>
        <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, margin: 16, marginBottom: 8 }}>EE Breakdown by Classification</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Nunito Sans' }}>
          <thead>
            <tr style={{ background: '#F3F8FA', borderBottom: '2px solid #CECECE' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Classification Group</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Total</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Women</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Women %</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Visible Minority</th>
              <th style={{ padding: 12, textAlign: 'right' }}>VM %</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Indigenous</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Ind %</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Disability</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Dis %</th>
            </tr>
          </thead>
          <tbody>
            {eeByClassification.map((row, i) => {
              const womenBelow = parseFloat(row.womenPct) < EE_TARGETS.women;
              const vmBelow = parseFloat(row.vmPct) < EE_TARGETS.visibleMinority;
              const indBelow = parseFloat(row.indPct) < EE_TARGETS.indigenous;
              const disBelow = parseFloat(row.disPct) < EE_TARGETS.disability;
              return (
                <tr key={row.group} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FA' }}>
                  <td style={{ padding: 10 }}>{row.group}</td>
                  <td style={{ padding: 10, textAlign: 'right' }}>{row.total}</td>
                  <td style={{ padding: 10, textAlign: 'right' }}>{row.women}</td>
                  <td style={{ padding: 10, textAlign: 'right', color: womenBelow ? '#AF3C43' : undefined }}>{row.womenPct}</td>
                  <td style={{ padding: 10, textAlign: 'right' }}>{row.vm}</td>
                  <td style={{ padding: 10, textAlign: 'right', color: vmBelow ? '#AF3C43' : undefined }}>{row.vmPct}</td>
                  <td style={{ padding: 10, textAlign: 'right' }}>{row.indigenous}</td>
                  <td style={{ padding: 10, textAlign: 'right', color: indBelow ? '#AF3C43' : undefined }}>{row.indPct}</td>
                  <td style={{ padding: 10, textAlign: 'right' }}>{row.disability}</td>
                  <td style={{ padding: 10, textAlign: 'right', color: disBelow ? '#AF3C43' : undefined }}>{row.disPct}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
