/**
 * HICC Workforce BI Tool — Placeholder
 * Dashboard implementation will follow the full spec.
 */
import { POSITIONS, ORG_HIERARCHY, FINANCE_DATA } from './data/generateData'

function App() {
  return (
    <div style={{ padding: 24, fontFamily: 'Nunito Sans, sans-serif' }}>
      <h1 style={{ fontFamily: 'Rubik', fontWeight: 300, fontSize: '2.25em', color: '#002D42' }}>
        HICC Workforce BI Tool
      </h1>
      <p style={{ color: '#666666' }}>
        Housing, Infrastructure and Communities Canada / Logement, Infrastructure et Collectivités Canada
      </p>
      <p>
        Data loaded: {POSITIONS.length} positions, {ORG_HIERARCHY.length} org rows, {FINANCE_DATA.length} finance records
      </p>
    </div>
  )
}

export default App
