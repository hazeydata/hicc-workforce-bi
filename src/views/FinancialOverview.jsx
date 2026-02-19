import { useMemo } from 'react';
import {
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
import Badge from '../components/Badge';
import { fmt, fmtK } from '../utils/formatters';
import { filterPositions, filterFinance } from '../utils/filters';
import { CHART_COLORS } from '../theme';

export default function FinancialOverview({ positions, financeData, filters }) {
  const filteredPositions = useMemo(
    () => filterPositions(positions, filters),
    [positions, filters]
  );
  const filteredFinance = useMemo(
    () => filterFinance(financeData, filters),
    [financeData, filters]
  );

  const totalBudget = filteredFinance.reduce((s, f) => s + f.budget, 0);
  const totalForecast = filteredFinance.reduce((s, f) => s + f.forecast, 0);
  const totalActuals = filteredFinance.reduce((s, f) => s + f.actuals, 0);
  const surplusDeficit = totalBudget - totalForecast;
  const surplusColor = surplusDeficit >= 0 ? '#92CC6F' : '#AF3C43';

  const byVoteType = useMemo(() => {
    const m = {};
    filteredFinance.forEach(f => {
      if (!m[f.voteType]) m[f.voteType] = { voteType: f.voteType, budget: 0, forecast: 0, actuals: 0 };
      m[f.voteType].budget += f.budget;
      m[f.voteType].forecast += f.forecast;
      m[f.voteType].actuals += f.actuals;
    });
    return Object.values(m);
  }, [filteredFinance]);

  const byDirectorate = useMemo(() => {
    const m = {};
    filteredFinance.forEach(f => {
      if (!m[f.directorateName]) m[f.directorateName] = { name: f.directorateName, budget: 0 };
      m[f.directorateName].budget += f.budget;
    });
    return Object.values(m)
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 10);
  }, [filteredFinance]);

  const salaryFinanceRows = useMemo(() => {
    const salaryFinance = filteredFinance.filter(f => f.voteType === 'Salary');
    const fcSet = new Set(salaryFinance.map(f => f.fundCentreCode));
    return fcSet.size === 0 ? [] : Array.from(fcSet).map(fc => {
      const fin = salaryFinance.find(f => f.fundCentreCode === fc);
      const occPositions = filteredPositions.filter(p => p.fundCentreCode === fc && p.occupancyStatus !== 'Vacant');
      const hrSalaryCost = occPositions.reduce((s, p) => s + (p.salary || 0), 0);
      const financeBudget = fin.budget;
      const variance = financeBudget - hrSalaryCost;
      const aligned = Math.abs(variance) < financeBudget * 0.1;
      return {
        fundCentre: fc,
        directorateName: fin.directorateName,
        positions: filteredPositions.filter(p => p.fundCentreCode === fc).length,
        occupied: occPositions.length,
        vacant: filteredPositions.filter(p => p.fundCentreCode === fc && p.occupancyStatus === 'Vacant').length,
        hrSalaryCost,
        financeBudget,
        variance,
        aligned,
      };
    });
  }, [filteredFinance, filteredPositions]);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontFamily: 'Rubik', fontWeight: 400, fontSize: '1.75em', marginBottom: 24 }}>
        Financial Overview
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard label="Total Budget" value={fmtK(totalBudget)} />
        <KPICard label="Total Forecast" value={fmtK(totalForecast)} />
        <KPICard
          label="Surplus/Deficit"
          value={fmtK(surplusDeficit)}
          accentColor={surplusColor}
          valueColor={surplusColor}
        />
        <KPICard label="YTD Actuals" value={fmtK(totalActuals)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Budget by Vote Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byVoteType} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey="voteType" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => (v / 1e6).toFixed(1) + 'M'} />
              <Tooltip formatter={v => fmtK(v)} />
              <Legend />
              <Bar dataKey="budget" name="Budget" fill={CHART_COLORS[0]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="forecast" name="Forecast" fill={CHART_COLORS[1]} radius={[0, 0, 0, 0]} />
              <Bar dataKey="actuals" name="Actuals" fill={CHART_COLORS[2]} radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 8, padding: 20, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Budget by Directorate (Top 10)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byDirectorate} layout="vertical" margin={{ left: 100 }}>
              <XAxis type="number" tickFormatter={v => (v / 1e6).toFixed(1) + 'M'} />
              <YAxis dataKey="name" type="category" width={95} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => fmtK(v)} />
              <Bar dataKey="budget" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background: '#FFFFFF', borderRadius: 8, border: '1px solid #CECECE', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto', maxHeight: 500 }}>
        <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, margin: 16, marginBottom: 8 }}>Integrated Salary Analysis</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Nunito Sans' }}>
          <thead>
            <tr style={{ background: '#F3F8FA', borderBottom: '2px solid #CECECE' }}>
              <th style={{ padding: 12, textAlign: 'left' }}>Fund Centre</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Positions</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Occupied</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Vacant</th>
              <th style={{ padding: 12, textAlign: 'right' }}>HR Salary Cost</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Finance Budget</th>
              <th style={{ padding: 12, textAlign: 'right' }}>Variance</th>
              <th style={{ padding: 12, textAlign: 'left' }}>Alignment</th>
            </tr>
          </thead>
          <tbody>
            {salaryFinanceRows.map((row, i) => (
              <tr key={row.fundCentre} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#F8F9FA' }}>
                <td style={{ padding: 10 }}>{row.directorateName}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>{row.positions}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>{row.occupied}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>{row.vacant}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>{fmt(row.hrSalaryCost)}</td>
                <td style={{ padding: 10, textAlign: 'right' }}>{fmt(row.financeBudget)}</td>
                <td style={{ padding: 10, textAlign: 'right', color: row.variance >= 0 ? '#92CC6F' : '#AF3C43' }}>
                  {fmt(row.variance)}
                </td>
                <td style={{ padding: 10 }}>
                  {row.aligned ? (
                    <Badge variant="aligned">✓ Aligned</Badge>
                  ) : (
                    <Badge variant="misaligned">⚠ Misaligned</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
