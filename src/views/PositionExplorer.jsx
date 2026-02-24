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
import { fmt, pct } from '../utils/formatters';
import { filterPositions } from '../utils/filters';
import { CLASSIFICATION_GROUPS, BRANCHES } from '../data/generateData';
import { CHART_COLORS, COLORS } from '../theme';

const PAGE_SIZE = 50;
const CARD_W = 240;
const V_GAP = 36;
const H_GAP = 20;

// ---------------------------------------------------------------------------
// Org Chart — Tree building & rollups
// ---------------------------------------------------------------------------
function buildOrgTree(positions) {
  const map = {};
  positions.forEach(p => {
    map[p.positionId] = { ...p, children: [] };
  });
  const roots = [];
  positions.forEach(p => {
    const node = map[p.positionId];
    const parent = p.reportingToPositionId ? map[p.reportingToPositionId] : null;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  roots.forEach(r => {
    r.children.sort((a, b) => (b.classificationLevel ?? 0) - (a.classificationLevel ?? 0));
  });
  function sortChildren(n) {
    n.children.sort((a, b) => (b.classificationLevel ?? 0) - (a.classificationLevel ?? 0));
    n.children.forEach(sortChildren);
  }
  roots.forEach(sortChildren);
  return { roots, map };
}

function computeRollups(node) {
  let totalSalary = node.salary || 0;
  let totalFTE = node.occupancyStatus !== 'Vacant' ? 1 : 0;
  let totalPositions = 1;
  let vacantCount = node.occupancyStatus === 'Vacant' ? 1 : 0;
  (node.children || []).forEach(child => {
    computeRollups(child);
    totalSalary += child._rollup?.totalSalary ?? 0;
    totalFTE += child._rollup?.totalFTE ?? 0;
    totalPositions += child._rollup?.totalPositions ?? 0;
    vacantCount += child._rollup?.vacantCount ?? 0;
  });
  node._rollup = { totalSalary, totalFTE, totalPositions, vacantCount };
  return node._rollup;
}

function filterOrgTree(node, query) {
  if (!query || !query.trim()) return node;
  const q = query.toLowerCase().trim();
  const selfMatch = [node.incumbentName, node.positionTitle, node.classification, node.positionId]
    .some(f => f?.toString().toLowerCase().includes(q));
  const filteredChildren = (node.children || []).map(c => filterOrgTree(c, query)).filter(Boolean);
  if (selfMatch || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Org Chart — Node Card
// ---------------------------------------------------------------------------
function OrgNodeCard({ node, isCollapsed, onToggle, isSelected, onSelect }) {
  const stripColor = node.occupancyStatus === 'Vacant' ? COLORS.danger
    : node.occupancyStatus === 'Occupied - Acting' ? COLORS.warning : COLORS.softGreen;
  const hasChildren = node.children?.length > 0;
  const rollup = node._rollup;

  return (
    <div
      onClick={() => onSelect(node)}
      style={{
        width: CARD_W,
        background: COLORS.white,
        border: `2px solid ${isSelected ? COLORS.teal : COLORS.neutralLight}`,
        borderRadius: 6,
        boxShadow: isSelected ? `0 0 0 3px ${COLORS.teal}33` : '0 1px 3px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      <div style={{ height: 3, background: stripColor }} />
      <div style={{ padding: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <span style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 12, color: node.occupancyStatus === 'Vacant' ? COLORS.danger : COLORS.textPrimary, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {node.incumbentName || 'Vacant'}
          </span>
          <Badge variant="default">{node.classification}</Badge>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {node.positionTitle}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
          <Badge variant={node.occupancyStatus === 'Occupied' ? 'occupied' : node.occupancyStatus === 'Vacant' ? 'vacant' : 'acting'}>
            {node.occupancyStatus}
          </Badge>
          <Badge variant={node.fundingSource === 'A-Base' ? 'aBase' : node.fundingSource === 'B-Base' ? 'bBase' : node.fundingSource === 'Program' ? 'program' : 'sunset'}>
            {node.fundingSource}
          </Badge>
        </div>
        {hasChildren && rollup && (
          <div style={{ fontSize: 10, color: COLORS.neutralMedium, marginTop: 6 }}>
            {rollup.totalPositions} pos · {rollup.vacantCount} vac
          </div>
        )}
      </div>
      {hasChildren && (
        <button
          onClick={e => { e.stopPropagation(); onToggle(node); }}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 18,
            height: 18,
            background: COLORS.bgLight,
            border: `1px solid ${COLORS.neutralLight}`,
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          {isCollapsed ? '+' : '−'}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Org Chart — Tree Node (recursive)
// ---------------------------------------------------------------------------
function TreeNode({ node, collapsedSet, onToggle, selectedId, onSelect, depth = 0 }) {
  const hasChildren = node.children?.length > 0;
  const isCollapsed = collapsedSet.has(node.positionId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <OrgNodeCard
        node={node}
        isCollapsed={isCollapsed}
        onToggle={onToggle}
        isSelected={selectedId === node.positionId}
        onSelect={onSelect}
      />
      {hasChildren && !isCollapsed && (
        <>
          <div style={{ width: 2, height: V_GAP / 2, background: COLORS.neutralLight }} />
          <div style={{ display: 'flex', gap: H_GAP, alignItems: 'flex-start', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: (node.children.length - 1) * (CARD_W + H_GAP) + CARD_W, height: 2, background: COLORS.neutralLight }} />
            {node.children.map(child => (
              <div key={child.positionId} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: V_GAP / 2, background: COLORS.neutralLight }} />
                <TreeNode
                  key={child.positionId}
                  node={child}
                  collapsedSet={collapsedSet}
                  onToggle={onToggle}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Org Chart — Detail Panel
// ---------------------------------------------------------------------------
function DetailPanel({ node, onClose }) {
  if (!node) return null;
  const stripColor = node.occupancyStatus === 'Vacant' ? COLORS.danger
    : node.occupancyStatus === 'Occupied - Acting' ? COLORS.warning : COLORS.softGreen;
  const branch = BRANCHES.find(b => b.branchCode === node.branchCode);
  const rollup = node._rollup;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 360,
        height: '100vh',
        background: COLORS.white,
        borderLeft: `1px solid ${COLORS.neutralLight}`,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        zIndex: 1000,
        overflow: 'auto',
      }}
    >
      <div style={{ height: 4, background: stripColor }} />
      <div style={{ padding: 20, position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            background: 'none',
            border: 'none',
            fontSize: 18,
            cursor: 'pointer',
            color: COLORS.neutralDark,
          }}
        >
          ✕
        </button>
        <div style={{ fontSize: 11, color: COLORS.neutralMedium, textTransform: 'uppercase', marginBottom: 4 }}>
          {node.positionId} · {node.classification}
        </div>
        <h3 style={{ fontFamily: 'Rubik', fontWeight: 700, fontSize: 17, margin: '0 0 4px 0' }}>
          {node.incumbentName || 'Vacant Position'}
        </h3>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: '0 0 16px 0' }}>{node.positionTitle}</p>

        <Badge variant={node.occupancyStatus === 'Occupied' ? 'occupied' : node.occupancyStatus === 'Vacant' ? 'vacant' : 'acting'} style={{ marginBottom: 16 }}>
          {node.occupancyStatus}
        </Badge>

        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Position Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
          <div style={{ background: COLORS.bgLight, padding: 10, borderRadius: 4 }}><div style={{ fontSize: 10, color: COLORS.neutralMedium }}>Branch</div>{branch?.branchName ?? node.branchCode}</div>
          <div style={{ background: COLORS.bgLight, padding: 10, borderRadius: 4 }}><div style={{ fontSize: 10, color: COLORS.neutralMedium }}>Classification</div>{node.classification}</div>
          <div style={{ background: COLORS.bgLight, padding: 10, borderRadius: 4 }}><div style={{ fontSize: 10, color: COLORS.neutralMedium }}>Tenure</div>{node.tenureType ?? '—'}</div>
          <div style={{ background: COLORS.bgLight, padding: 10, borderRadius: 4 }}><div style={{ fontSize: 10, color: COLORS.neutralMedium }}>Funding</div>{node.fundingSource}</div>
          <div style={{ background: COLORS.bgLight, padding: 10, borderRadius: 4 }}><div style={{ fontSize: 10, color: COLORS.neutralMedium }}>Language</div>{node.languageProfile}</div>
          <div style={{ background: COLORS.bgLight, padding: 10, borderRadius: 4 }}><div style={{ fontSize: 10, color: COLORS.neutralMedium }}>Location</div>{node.location?.city ?? '—'}</div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Financial</div>
        <div style={{ background: COLORS.bgLight, padding: 12, borderRadius: 4, marginBottom: 20 }}>
          <div>Salary: {fmt(node.salary)}</div>
          <div style={{ fontSize: 11, color: COLORS.neutralMedium }}>Fund Centre: {node.fundCentreCode}</div>
          {node.fundingSource === 'Sunset' && node.fundingSunsetDate && (
            <div style={{ color: COLORS.danger, fontSize: 12, marginTop: 8 }}>⚠ Sunset: {node.fundingSunsetDate}</div>
          )}
        </div>

        {rollup && node.children?.length > 0 && (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Subtree Rollup</div>
            <div style={{ background: `${COLORS.teal}12`, padding: 12, borderRadius: 4, marginBottom: 20 }}>
              <div>Total Salary: {fmt(rollup.totalSalary)}</div>
              <div>FTEs: {rollup.totalFTE}</div>
              <div>Vacant: {rollup.vacantCount}</div>
              <div>Vacancy Rate: {pct(rollup.vacantCount, rollup.totalPositions)}</div>
            </div>
          </>
        )}

        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Dates</div>
        <div style={{ fontSize: 13 }}>
          Start: {node.startDate ?? '—'}<br />
          End: {node.endDate ?? '—'}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Org Chart View
// ---------------------------------------------------------------------------
function OrgChartView({ positions }) {
  const [orgSearch, setOrgSearch] = useState('');
  const [collapsedSet, setCollapsedSet] = useState(new Set());
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(0.45);

  const { roots, map } = useMemo(() => buildOrgTree(positions), [positions]);

  const filteredRoots = useMemo(() => {
    const result = !orgSearch?.trim() ? roots : roots.map(r => filterOrgTree(r, orgSearch)).filter(Boolean);
    result.forEach(r => computeRollups(r));
    return result;
  }, [roots, orgSearch]);

  const allNodesWithChildren = useMemo(() => {
    const ids = new Set();
    function collect(n) {
      if (n.children?.length > 0) ids.add(n.positionId);
      n.children?.forEach(collect);
    }
    filteredRoots.forEach(collect);
    return ids;
  }, [filteredRoots]);

  const expandAll = () => setCollapsedSet(new Set());
  const collapseAll = () => setCollapsedSet(new Set(allNodesWithChildren));

  const toggleNode = node => {
    setCollapsedSet(prev => {
      const next = new Set(prev);
      if (next.has(node.positionId)) next.delete(node.positionId);
      else next.add(node.positionId);
      return next;
    });
  };

  const vacantCount = filteredRoots.reduce((acc, r) => acc + (r._rollup?.vacantCount ?? 0), 0);
  const totalCount = filteredRoots.reduce((acc, r) => acc + (r._rollup?.totalPositions ?? 0), 0);

  const btnStyle = {
    background: COLORS.white,
    border: `1px solid ${COLORS.darkNavy}`,
    color: COLORS.darkNavy,
    borderRadius: 4,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'Nunito Sans',
    cursor: 'pointer',
  };

  if (positions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: COLORS.textMuted }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No positions match</div>
        <div>Try adjusting your search or filters</div>
      </div>
    );
  }

  if (filteredRoots.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: COLORS.textMuted }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No positions match</div>
        <div>Try adjusting your search or filters</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search org chart..."
          value={orgSearch}
          onChange={e => setOrgSearch(e.target.value)}
          style={{ border: `1px solid ${COLORS.neutralLight}`, borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 200 }}
        />
        <button onClick={expandAll} style={btnStyle}>Expand All</button>
        <button onClick={collapseAll} style={btnStyle}>Collapse All</button>
        <div style={{ flex: 1, textAlign: 'right', fontSize: 14, color: COLORS.textMuted }}>
          {totalCount} positions · {vacantCount} vacant
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => setZoom(z => Math.max(0.15, z - 0.05))} style={{ ...btnStyle, padding: '6px 10px' }}>−</button>
          <button onClick={() => setZoom(0.45)} style={{ ...btnStyle, padding: '6px 10px' }}>⛶</button>
          <button onClick={() => setZoom(z => Math.min(1.2, z + 0.05))} style={{ ...btnStyle, padding: '6px 10px' }}>+</button>
          <span style={{ fontSize: 13, marginLeft: 8, minWidth: 40 }}>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div
        style={{
          background: COLORS.bgLight,
          backgroundImage: `radial-gradient(${COLORS.neutralLight} 0.5px, transparent 0.5px)`,
          backgroundSize: '18px 18px',
          border: `1px solid ${COLORS.neutralLight}`,
          borderRadius: 8,
          overflow: 'auto',
          minHeight: 500,
          maxHeight: 'calc(100vh - 340px)',
          padding: 32,
        }}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48 }}>
          {filteredRoots.map(root => (
            <TreeNode
              key={root.positionId}
              node={root}
              collapsedSet={collapsedSet}
              onToggle={toggleNode}
              selectedId={selectedNode?.positionId}
              onSelect={setSelectedNode}
            />
          ))}
        </div>
      </div>

      {selectedNode && <DetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Position Explorer (main)
// ---------------------------------------------------------------------------
export default function PositionExplorer({ positions, filters }) {
  const [view, setView] = useState('table');
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
    if (occupancyFilter) result = result.filter(p => p.occupancyStatus === occupancyFilter);
    if (classificationFilter) result = result.filter(p => p.classificationGroup === classificationFilter);
    if (fundingFilter) result = result.filter(p => p.fundingSource === fundingFilter);
    if (branchFilter) result = result.filter(p => p.branchCode === branchFilter);
    return result;
  }, [positions, filters, search, occupancyFilter, classificationFilter, fundingFilter, branchFilter]);

  const occupied = filteredPositions.filter(p => p.occupancyStatus !== 'Vacant');
  const vacant = filteredPositions.filter(p => p.occupancyStatus === 'Vacant');
  const totalSalary = useMemo(() => occupied.reduce((s, p) => s + (p.salary || 0), 0), [occupied]);

  const classificationByGroup = useMemo(() => {
    const m = {};
    filteredPositions.forEach(p => { m[p.classificationGroup] = (m[p.classificationGroup] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredPositions]);

  const fundingBySource = useMemo(() => {
    const m = {};
    filteredPositions.forEach(p => { m[p.fundingSource] = (m[p.fundingSource] || 0) + 1; });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [filteredPositions]);

  const fundingColors = { 'A-Base': CHART_COLORS[1], 'B-Base': CHART_COLORS[8], 'Program': CHART_COLORS[3], 'Sunset': CHART_COLORS[7] };

  const sorted = useMemo(() => {
    const arr = [...filteredPositions];
    arr.sort((a, b) => {
      let va = sortKey === 'location' ? (a.location?.city ?? '') : a[sortKey];
      let vb = sortKey === 'location' ? (b.location?.city ?? '') : b[sortKey];
      if (va == null) va = '';
      if (vb == null) vb = '';
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

  const toggleStyle = (active) => ({
    background: active ? COLORS.darkNavy : COLORS.white,
    color: active ? COLORS.white : COLORS.darkNavy,
    border: `1px solid ${COLORS.darkNavy}`,
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 700,
    fontFamily: 'Nunito Sans',
    cursor: 'pointer',
    borderRadius: 0,
  });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'Rubik', fontWeight: 400, fontSize: '1.75em', margin: 0 }}>
          Position Explorer
        </h2>
        <div style={{ display: 'flex', border: `1px solid ${COLORS.darkNavy}`, borderRadius: 6, overflow: 'hidden' }}>
          <button onClick={() => setView('table')} style={{ ...toggleStyle(view === 'table'), borderRight: view === 'table' ? 'none' : `1px solid ${COLORS.darkNavy}`, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }}>
            ☰ Table View
          </button>
          <button onClick={() => setView('orgchart')} style={{ ...toggleStyle(view === 'orgchart'), borderTopRightRadius: 6, borderBottomRightRadius: 6 }}>
            ⊞ Org Chart
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <KPICard label="Filtered Positions" value={filteredPositions.length} />
        <KPICard label="Occupied" value={occupied.length} accentColor="#92CC6F" />
        <KPICard label="Vacant" value={vacant.length} accentColor="#AF3C43" />
        <KPICard label="Total Salary Cost" value={fmt(totalSalary)} />
      </div>

      {view === 'table' && (
        <>
          {filters.branch && (
            <p style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 12 }}>
              Filtered globally to: {BRANCHES.find(b => b.branchCode === filters.branch)?.branchName ?? filters.branch}
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Search position ID, title, incumbent, classification..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              aria-label="Search positions"
              style={{ border: `1px solid ${COLORS.neutralLight}`, borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 280 }}
            />
            <select value={occupancyFilter} onChange={e => { setOccupancyFilter(e.target.value); setPage(1); }} aria-label="Filter by occupancy status" style={{ border: `1px solid ${COLORS.neutralLight}`, borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 140 }}>
              <option value="">All Status</option>
              <option value="Occupied">Occupied</option>
              <option value="Vacant">Vacant</option>
              <option value="Occupied - Acting">Acting</option>
            </select>
            <select value={classificationFilter} onChange={e => { setClassificationFilter(e.target.value); setPage(1); }} aria-label="Filter by classification group" style={{ border: `1px solid ${COLORS.neutralLight}`, borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 140 }}>
              <option value="">All Classifications</option>
              {CLASSIFICATION_GROUPS.map(g => <option key={g.code} value={g.code}>{g.code}</option>)}
            </select>
            <select value={fundingFilter} onChange={e => { setFundingFilter(e.target.value); setPage(1); }} aria-label="Filter by funding source" style={{ border: `1px solid ${COLORS.neutralLight}`, borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 120 }}>
              <option value="">All Funding</option>
              <option value="A-Base">A-Base</option>
              <option value="B-Base">B-Base</option>
              <option value="Program">Program</option>
              <option value="Sunset">Sunset</option>
            </select>
            <select value={branchFilter} onChange={e => { setBranchFilter(e.target.value); setPage(1); }} aria-label="Filter by branch" style={{ border: `1px solid ${COLORS.neutralLight}`, borderRadius: 4, padding: '8px 12px', fontSize: 14, fontFamily: 'Nunito Sans', minWidth: 120 }}>
              <option value="">All Branches</option>
              {BRANCHES.map(b => <option key={b.branchCode} value={b.branchCode}>{b.branchCode}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div style={{ background: COLORS.white, borderRadius: 8, padding: 20, border: `1px solid ${COLORS.neutralLight}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
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
            <div style={{ background: COLORS.white, borderRadius: 8, padding: 20, border: `1px solid ${COLORS.neutralLight}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontFamily: 'Nunito Sans', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Funding Source Mix</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={fundingBySource} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {fundingBySource.map((entry, i) => <Cell key={i} fill={fundingColors[entry.name] || CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: COLORS.white, borderRadius: 8, border: `1px solid ${COLORS.neutralLight}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: 'Nunito Sans' }}>
              <thead>
                <tr style={{ background: '#F3F8FA', borderBottom: `2px solid ${COLORS.neutralLight}` }}>
                  {[['positionId', 'Position ID'], ['classification', 'Classification'], ['positionTitle', 'Title'], ['occupancyStatus', 'Status'], ['incumbentName', 'Incumbent'], ['tenureType', 'Tenure'], ['fundingSource', 'Funding'], ['languageProfile', 'Language'], ['location', 'Location'], ['salary', 'Salary']].map(([key, label]) => (
                    <th key={key} onClick={() => handleSort(key)} style={{ padding: 12, textAlign: key === 'salary' ? 'right' : 'left', cursor: 'pointer', userSelect: 'none' }}>
                      {label} {sortKey === key && (sortDir === 1 ? '↑' : '↓')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, i) => (
                  <tr key={row.positionId} style={{ background: i % 2 === 0 ? COLORS.white : '#F8F9FA' }}>
                    <td style={{ padding: 10, fontFamily: 'monospace' }}>{row.positionId}</td>
                    <td style={{ padding: 10 }}><Badge variant="default">{row.classification}</Badge></td>
                    <td style={{ padding: 10 }}>{row.positionTitle}</td>
                    <td style={{ padding: 10 }}><Badge variant={row.occupancyStatus === 'Occupied' ? 'occupied' : row.occupancyStatus === 'Vacant' ? 'vacant' : 'acting'}>{row.occupancyStatus}</Badge></td>
                    <td style={{ padding: 10 }}>{row.incumbentName ?? '—'}</td>
                    <td style={{ padding: 10 }}>{row.tenureType ?? '—'}</td>
                    <td style={{ padding: 10 }}><Badge variant={row.fundingSource === 'A-Base' ? 'aBase' : row.fundingSource === 'B-Base' ? 'bBase' : row.fundingSource === 'Program' ? 'program' : 'sunset'}>{row.fundingSource}</Badge></td>
                    <td style={{ padding: 10 }}>{row.languageProfile}</td>
                    <td style={{ padding: 10 }}>{row.location?.city ?? '—'}</td>
                    <td style={{ padding: 10, textAlign: 'right' }}>{fmt(row.salary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderTop: '1px solid #E0E0E0' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ background: COLORS.white, border: `1px solid ${COLORS.darkNavy}`, color: COLORS.darkNavy, borderRadius: 4, padding: '8px 16px', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito Sans', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.5 : 1 }}>← Prev</button>
              <span style={{ fontSize: 14, color: COLORS.textMuted }}>Page {page} of {totalPages} ({filteredPositions.length} positions)</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ background: COLORS.white, border: `1px solid ${COLORS.darkNavy}`, color: COLORS.darkNavy, borderRadius: 4, padding: '8px 16px', fontSize: 14, fontWeight: 700, fontFamily: 'Nunito Sans', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}>Next →</button>
            </div>
          </div>
        </>
      )}

      {view === 'orgchart' && <OrgChartView positions={filteredPositions} />}
    </div>
  );
}
