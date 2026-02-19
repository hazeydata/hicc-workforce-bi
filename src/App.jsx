/**
 * ============================================================================
 * HICC WORKFORCE BI TOOL
 * Housing, Infrastructure and Communities Canada — Corporate Services Branch
 * Integrated HR + Finance workforce planning dashboard
 * ============================================================================
 *
 * DATA INTEGRATION: See src/data/generateData.js for the full data swap guide.
 * Replace ORG_HIERARCHY, POSITIONS, FINANCE_DATA with real API data when ready.
 * ============================================================================
 */
import { useState, useCallback } from 'react';
import { POSITIONS, FINANCE_DATA } from './data/generateData';
import Header from './components/Header';
import ExecutiveSummary from './views/ExecutiveSummary';
import PositionExplorer from './views/PositionExplorer';
import FinancialOverview from './views/FinancialOverview';
import WorkforcePlanning from './views/WorkforcePlanning';
import ScenarioPlanning from './views/ScenarioPlanning';
import EmploymentEquity from './views/EmploymentEquity';

function App() {
  const [activeTab, setActiveTab] = useState('executive');
  const [filters, setFilters] = useState({ branch: null, directorate: null, division: null });

  const handleFilterChange = useCallback(updates => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ branch: null, directorate: null, division: null });
  }, []);

  const renderView = () => {
    switch (activeTab) {
      case 'executive':
        return <ExecutiveSummary positions={POSITIONS} financeData={FINANCE_DATA} filters={filters} />;
      case 'positions':
        return <PositionExplorer positions={POSITIONS} filters={filters} />;
      case 'financial':
        return <FinancialOverview positions={POSITIONS} financeData={FINANCE_DATA} filters={filters} />;
      case 'workforce':
        return <WorkforcePlanning positions={POSITIONS} filters={filters} />;
      case 'scenario':
        return <ScenarioPlanning positions={POSITIONS} filters={filters} />;
      case 'equity':
        return <EmploymentEquity positions={POSITIONS} filters={filters} />;
      default:
        return <ExecutiveSummary positions={POSITIONS} financeData={FINANCE_DATA} filters={filters} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5' }}>
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />
      <main>{renderView()}</main>

      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          padding: '6px 12px',
          background: '#FEC04F22',
          border: '1px solid #FEC04F66',
          color: '#996B00',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'Nunito Sans',
          zIndex: 1000,
        }}
      >
        ⚠ PROTOTYPE — SYNTHETIC DATA
      </div>
    </div>
  );
}

export default App;
