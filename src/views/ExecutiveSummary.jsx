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
import LollipopBar from '../components/LollipopBar';
import KPICard from '../components/KPICard';
import Badge from '../components/Badge';
import { fmt, fmtK, pct } from '../utils/formatters';
import { filterPositions, filterFinance } from '../utils/filters';
import { ORG_HIERARCHY } from '../data/generateData';
import { CHART_COLORS } from '../theme';

const REF_DATE = '2026-02-19';
const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;

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

export default function ExecutiveSummary({ positions, financeData, filters }) {
  const filteredPositions = useMemo(
    () => filterPositions(positions, filters),
    [positions, filters]
  );
  const filteredFinance = useMemo(
    () => filterFinance(financeData, filters),
    [financeData, filters]
  );

  const occupied = filteredPositions.filter(p => p.occupancyStatus === 'Occupied' || p.occupancyStatus === 'Occupied - Acting');
  const vacant = filteredPositions.filter(p => p.occupancyStatus === 'Vacant');
  const acting = filteredPositions.filter(p => p.occupancyStatus === 'Occupied - Acting');
  const indeterminate = filteredPositions.filter(p => p.tenureType === 'Indeterminate' && p.occupancyStatus !== 'Vacant');
  const termCasual = filteredPositions.filter(p => ['Term', 'Casual', 'Student', 'Assignment', 'Secondment'].includes(p.tenureType));

  const totalBudget = useMemo(
    () => filteredFinance.reduce((s, f) => s + f.budget, 0),
    [filteredFinance]
  );
  const totalForecast = useMemo(
    () => filteredFinance.reduce((s, f) => s + f.forecast, 0),
    [filteredFinance]
  );
  const totalActuals = useMemo(
    () => filteredFinance.reduce((s, f) => s + f.actuals, 0),
    [filteredFinance]
  );
  const salaryBurnRate = totalForecast > 0 ? (totalActuals / totalForecast) * 100 : 0;
  const burnColor = salaryBurnRate > 85 ? '#AF3C43' : salaryBurnRate >= 70 ? '#FEC04F' : '#92CC6F';

  const criticalVacant = filteredPositions.filter(p => p.isCritical && p.occupancyStatus === 'Vacant');
  const totalCritical = filteredPositions.filter(p => p.isCritical);

  const sunsetPositions = filteredPositions.filter(p => p.fundingSource === 'Sunset');
  const doubleBanked = filteredPositions.filter(p => p.isDoublebanked);
  const termsEnding6Mo = filteredPositions.filter(p =>
    p.endDate && isWithinDays(p.endDate, 180)
  );

  const occupancyChartData = [
    { name: 'Indeterminate', value: indeterminate.length, color: CHART_COLORS[0] },
    { name: 'Term/Casual', value: termCasual.length, color: CHART_COLORS[1] },
    { name: 'Acting', value: acting.length, color: CHART_COLORS[2] },
    { name: 'Vacant', value: vacant.length, color: CHART_COLORS[7] },
  ].filter(d => d.value > 0);

  const dirToBranch = useMemo(() => {
    const m = {};
    ORG_HIERARCHY.forEach(r => { m[r.directorateCode] = r.branchCode; });
    return m;
  }, []);

  const budgetByBranch = useMemo(() => {
    const byBranch = {};
    filteredFinance.forEach(f => {
      const branch = dirToBranch[f.directorateCode] ?? f.directorateCode;
      if (!byBranch[branch]) byBranch[branch] = { branch, budget: 0, forecast: 0 };
      byBranch[branch].budget += f.budget;
      byBranch[branch].forecast += f.forecast;
    });
    return Object.values(byBranch);
  }, [filteredFinance, dirToBranch]);

  const vacancyRate = filteredPositions.length > 0
    ? ((vacant.length / filteredPositions.length) * 100).toFixed(1)
    : '0';

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontFamily: 'Rubik', fontWeight: 400, fontSize: '1.75em', marginBottom: 24 }}>
        Executive Summary
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard
          label="Total Positions"
          value={filteredPositions.length}
          subtitle={`${occupied.length} occupied`}
        />
        <KPICard
          label="Vacant Positions"
          value={vacant.length}
          subtitle={`${vacancyRate}% vacancy rate`}
          accentColor="#AF3C43"
        />
        <KPICard
          label="Total Budget"
          value={fmtK(totalBudget)}
          subtitle={`Forecast: ${fmtK(totalForecast)}`}
        />
        <KPICard
          label="Salary Burn Rate"
          value={salaryBurnRate.toFixed(1) + '%'}
          subtitle={`Actuals: ${fmtK(totalActuals)}`}
          accentColor={burnColor}
          valueColor={burnColor}
        />
        <KPICard
          label="Critical Vacancies"
          value={criticalVacant.length}
          subtitle={`of ${totalCritical.length} critical positions`}
          accentColor={criticalVacant.length > 0 ? '#AF3C43' : '#92CC6F'}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Position Occupancy</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={occupancyChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {occupancyChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v, '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Budget vs Forecast by Branch</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={budgetByBranch} margin={{ top: 20, right: 24, left: 0, bottom: 5 }} barSize={28} barCategoryGap="40%" barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
              <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => (v / 1e6).toFixed(1) + 'M'} domain={[0, (Math.max(...budgetByBranch.flatMap(d => [d.budget, d.forecast]), 0) || 1) * 1.1]} />
              <Tooltip formatter={v => fmtK(v)} />
              <Legend />
              <Bar dataKey="budget" name="Budget" fill={CHART_COLORS[0]} shape={(p) => <LollipopBar {...p} dataKey="budget" format="currency" />} />
              <Bar dataKey="forecast" name="Forecast" fill={CHART_COLORS[1]} shape={(p) => <LollipopBar {...p} dataKey="forecast" format="currency" />} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard label="Sunset Funding Positions" value={sunsetPositions.length} accentColor="#AF3C43" />
        <KPICard label="Double/Triple Banked" value={doubleBanked.length} accentColor="#FEC04F" />
        <KPICard label="Terms Ending Within 6 Months" value={termsEnding6Mo.length} accentColor="#FEC04F" />
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto', maxHeight: 400 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Nunito Sans' }}>
          <thead>
            <tr style={{ background: '#F3F8FA', borderBottom: '2px solid #CECECE' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Directorate</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Vote Type</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Budget</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Forecast</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Surplus/Deficit</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Actuals</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Burn Rate</th>
            </tr>
          </thead>
          <tbody>
            {filteredFinance.map((row, i) => {
              const surplus = row.budget - row.forecast;
              const burn = row.forecast > 0 ? (row.actuals / row.forecast) * 100 : 0;
              const surplusColor = surplus >= 0 ? '#92CC6F' : '#AF3C43';
              const burnColor = burn > 85 ? '#AF3C43' : burn >= 70 ? '#FEC04F' : '#92CC6F';
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FA' }}>
                  <td style={{ padding: 10 }}>{row.directorateName}</td>
                  <td style={{ padding: 10 }}>
                    <Badge variant={row.voteType === 'Salary' ? 'aBase' : row.voteType === 'O&M' ? 'bBase' : 'program'}>
                      {row.voteType}
                    </Badge>
                  </td>
                  <td style={{ padding: 10, textAlign: 'right' }}>{fmt(row.budget)}</td>
                  <td style={{ padding: 10, textAlign: 'right' }}>{fmt(row.forecast)}</td>
                  <td style={{ padding: 10, textAlign: 'right', color: surplusColor }}>{fmt(surplus)}</td>
                  <td style={{ padding: 10, textAlign: 'right' }}>{fmt(row.actuals)}</td>
                  <td style={{ padding: 10, textAlign: 'right', color: burnColor }}>{burn.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
