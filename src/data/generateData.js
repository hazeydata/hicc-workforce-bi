/**
 * ============================================================================
 * HICC WORKFORCE BI TOOL — SYNTHETIC DATA GENERATOR
 * Housing, Infrastructure and Communities Canada
 * Corporate Services Branch — CDO / Data Analytics
 * ============================================================================
 *
 * PURPOSE:
 * Generates realistic synthetic data mirroring the structure of HICC's
 * HR Insights Report (MyGCHR/UDP) and FMA Financial Dashboard (SAP/Finance Hub).
 * This data is for PROTOTYPE PURPOSES ONLY.
 *
 * ============================================================================
 * DATA INTEGRATION GUIDE — HOW TO SWAP IN REAL DATA
 * ============================================================================
 *
 * When ready to connect real data, replace the objects exported from this file
 * with actual data from your sources. The schema below documents every field.
 *
 * SOURCE MAPPING:
 * ┌─────────────────────┬──────────────────────────────────────────────────┐
 * │ Prototype Field      │ Real Data Source                                │
 * ├─────────────────────┼──────────────────────────────────────────────────┤
 * │ ORG_HIERARCHY        │ SAP Org Structure / MyGCHR Org Tables           │
 * │ POSITIONS            │ MyGCHR Position Master / UDP position tables    │
 * │ FINANCE_DATA         │ SAP Finance Data Hub / FMA Dashboard tables     │
 * │ EMPLOYEES            │ MyGCHR Employee tables / UDP person tables      │
 * └─────────────────────┴──────────────────────────────────────────────────┘
 *
 * JOIN KEYS:
 * - Position ↔ Fund Centre: position.fundCentreCode → finance.fundCentreCode
 * - Position ↔ Employee: position.positionId → employee.positionId
 * - Position ↔ Org: position.directorateCode → org.directorateCode
 * - Finance ↔ Org: finance.directorateCode → org.directorateCode
 *
 * CURRENT ASSUMPTION: 1:1 position-to-fund-centre mapping.
 * If your real data is 1:many, change position.fundCentreCode to
 * position.fundCentreCodes (array) and update the join logic in the
 * dashboard components accordingly.
 *
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// REFERENCE DATA — Classification Groups
// ---------------------------------------------------------------------------
// Source: MyGCHR / Treasury Board classification structure
// These match the occupational groups visible in the HR Insights "All Positions" page

const CLASSIFICATION_GROUPS = [
  { code: 'AS', name: 'Administrative Services', levels: [1,2,3,4,5,6,7,8] },
  { code: 'CR', name: 'Clerical and Regulatory', levels: [3,4,5] },
  { code: 'EC', name: 'Economics and Social Science Services', levels: [2,3,4,5,6,7,8] },
  { code: 'EX', name: 'Executive', levels: [1,2,3,4,5] },
  { code: 'IS', name: 'Information Services', levels: [2,3,4,5,6] },
  { code: 'IT', name: 'Information Technology', levels: [1,2,3,4,5] },
  { code: 'PC', name: 'Physical Sciences', levels: [2,3,4] },
  { code: 'PE', name: 'Personnel Administration', levels: [2,3,4,5,6] },
  { code: 'PG', name: 'Procurement and Supply', levels: [1,2,3,4,5,6] },
  { code: 'PM', name: 'Programme Administration', levels: [1,2,3,4,5,6] },
  { code: 'EG', name: 'Engineering and Scientific Support', levels: [2,3,4,5,6,7] },
  { code: 'ENENG', name: 'Engineering', levels: [3,4,5,6] },
  { code: 'FI', name: 'Financial Management', levels: [1,2,3,4] },
  { code: 'CO', name: 'Commerce', levels: [1,2,3] },
];

// Weighted distribution to match real proportions from the All Positions chart
const CLASSIFICATION_WEIGHTS = {
  'EC': 0.47, 'AS': 0.15, 'PM': 0.087, 'PE': 0.027, 'IS': 0.06,
  'IT': 0.065, 'EX': 0.06, 'PG': 0.004, 'EG': 0.009, 'CR': 0.005,
  'PC': 0.021, 'ENENG': 0.008, 'FI': 0.02, 'CO': 0.014,
};

// ---------------------------------------------------------------------------
// REFERENCE DATA — Salary Ranges (approximate mid-points by group+level)
// ---------------------------------------------------------------------------
// Source: Treasury Board pay scales (approximated for prototype)
const SALARY_RANGES = {
  'AS-01': 58000, 'AS-02': 66000, 'AS-03': 73000, 'AS-04': 80000,
  'AS-05': 90000, 'AS-06': 101000, 'AS-07': 113000, 'AS-08': 126000,
  'CR-03': 48000, 'CR-04': 52000, 'CR-05': 56000,
  'EC-02': 68000, 'EC-03': 77000, 'EC-04': 87000, 'EC-05': 101000,
  'EC-06': 114000, 'EC-07': 131000, 'EC-08': 148000,
  'EX-01': 152000, 'EX-02': 172000, 'EX-03': 198000, 'EX-04': 225000, 'EX-05': 260000,
  'IS-02': 66000, 'IS-03': 76000, 'IS-04': 87000, 'IS-05': 100000, 'IS-06': 112000,
  'IT-01': 65000, 'IT-02': 80000, 'IT-03': 95000, 'IT-04': 110000, 'IT-05': 125000,
  'PC-02': 72000, 'PC-03': 86000, 'PC-04': 100000,
  'PE-02': 72000, 'PE-03': 82000, 'PE-04': 94000, 'PE-05': 108000, 'PE-06': 122000,
  'PG-01': 58000, 'PG-02': 65000, 'PG-03': 74000, 'PG-04': 84000, 'PG-05': 96000, 'PG-06': 108000,
  'PM-01': 58000, 'PM-02': 66000, 'PM-03': 73000, 'PM-04': 82000, 'PM-05': 94000, 'PM-06': 108000,
  'EG-02': 60000, 'EG-03': 70000, 'EG-04': 80000, 'EG-05': 92000, 'EG-06': 104000, 'EG-07': 116000,
  'ENENG-03': 85000, 'ENENG-04': 98000, 'ENENG-05': 112000, 'ENENG-06': 128000,
  'FI-01': 62000, 'FI-02': 78000, 'FI-03': 96000, 'FI-04': 115000,
  'CO-01': 65000, 'CO-02': 82000, 'CO-03': 100000,
};

// ---------------------------------------------------------------------------
// REFERENCE DATA — Organizational Hierarchy
// ---------------------------------------------------------------------------
/**
 * SCHEMA: ORG_HIERARCHY
 * ┌──────────────────────┬──────────┬────────────────────────────────────────┐
 * │ Field                │ Type     │ Description                            │
 * ├──────────────────────┼──────────┼────────────────────────────────────────┤
 * │ branchCode           │ string   │ Branch identifier code                 │
 * │ branchName           │ string   │ Full branch name                       │
 * │ directorateCode      │ string   │ Directorate identifier (e.g. "101009") │
 * │ directorateName      │ string   │ Full directorate name                  │
 * │ divisionCode         │ string   │ Division identifier                    │
 * │ divisionName         │ string   │ Full division name                     │
 * │ fundCentreCode       │ string   │ Fund centre mapped to directorate      │
 * └──────────────────────┴──────────┴────────────────────────────────────────┘
 *
 * REAL DATA SOURCE: SAP Org Structure + MyGCHR Org hierarchy
 * NOTE: fundCentreCode currently maps 1:1 to directorate. Adjust if needed.
 */

const BRANCHES = [
  {
    branchCode: 'CSB', branchName: 'Corporate Services Branch',
    directorates: [
      { code: '101001', name: 'Human Resources', divisions: ['HR Policy & Programs', 'HR Operations', 'Classification & Org Design', 'Workplace Relations'] },
      { code: '101002', name: 'Finance & Administration', divisions: ['Financial Planning & Reporting', 'Accounting Operations', 'Procurement & Contracting', 'Facilities & Security'] },
      { code: '101003', name: 'Information Management & Technology', divisions: ['Enterprise Architecture', 'Application Development', 'IT Infrastructure & Operations', 'IM & Data Governance'] },
    ]
  },
  {
    branchCode: 'PPB', branchName: 'Programs & Policy Branch',
    directorates: [
      { code: '102001', name: 'Policy Development', divisions: ['Housing Policy', 'Infrastructure Policy', 'Communities Policy', 'Strategic Analysis'] },
      { code: '102002', name: 'Program Design & Delivery', divisions: ['Housing Programs', 'Infrastructure Programs', 'Community Development Programs'] },
      { code: '102003', name: 'Research & Evaluation', divisions: ['Program Evaluation', 'Research & Data Analytics', 'Performance Measurement'] },
    ]
  },
  {
    branchCode: 'IPB', branchName: 'Infrastructure Programs Branch',
    directorates: [
      { code: '103001', name: 'Major Projects', divisions: ['Transit Projects', 'Green Infrastructure', 'Trade & Transport Corridors', 'Project Engineering'] },
      { code: '103002', name: 'Community Infrastructure', divisions: ['Rural & Northern Infrastructure', 'Municipal Infrastructure', 'Recreational Infrastructure'] },
      { code: '103003', name: 'Program Operations', divisions: ['Claims & Payments', 'Compliance & Audit', 'Recipient Relations'] },
    ]
  },
  {
    branchCode: 'HPB', branchName: 'Housing Programs Branch',
    directorates: [
      { code: '104001', name: 'Affordable Housing', divisions: ['Rental Construction', 'Social Housing Modernization', 'Co-operative Housing'] },
      { code: '104002', name: 'Indigenous Housing', divisions: ['Urban Indigenous Housing', 'Northern Housing', 'Indigenous Partnerships'] },
      { code: '104003', name: 'Homelessness Policy & Programs', divisions: ['Reaching Home Program', 'Homelessness Research', 'Community Partnerships'] },
    ]
  },
  {
    branchCode: 'CMB', branchName: 'Communications & Marketing Branch',
    directorates: [
      { code: '105001', name: 'Strategic Communications', divisions: ['Media Relations', 'Ministerial Affairs', 'Issues Management'] },
      { code: '105002', name: 'Digital & Creative Services', divisions: ['Web & Social Media', 'Design & Production', 'Content Strategy'] },
    ]
  },
  {
    branchCode: 'LSD', branchName: 'Legal Services',
    directorates: [
      { code: '106001', name: 'Legal Advisory', divisions: ['Program Legal Services', 'Corporate Legal Services', 'Litigation'] },
    ]
  },
  {
    branchCode: 'IAB', branchName: 'Internal Audit Branch',
    directorates: [
      { code: '107001', name: 'Audit & Assurance', divisions: ['Financial Audit', 'Performance Audit', 'IT Audit'] },
    ]
  },
];

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);

function pick(arr) { return arr[Math.floor(rand() * arr.length)]; }
function pickWeighted(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function generateName() {
  const firstNames = [
    'James','Mary','Robert','Patricia','Michael','Jennifer','David','Linda','William','Elizabeth',
    'Richard','Barbara','Joseph','Susan','Thomas','Jessica','Charles','Sarah','Daniel','Karen',
    'Matthew','Lisa','Anthony','Nancy','Mark','Betty','Steven','Margaret','Paul','Sandra',
    'Jean','Marie','Pierre','Sophie','François','Isabelle','André','Catherine','Michel','Nathalie',
    'Luc','Chantal','Denis','Monique','Yves','Diane','Alain','Julie','Marc','Sylvie',
    'Amir','Priya','Wei','Fatima','Omar','Mei','Raj','Amina','Hassan','Yuki',
    'Carlos','Maria','Ahmed','Noor','Deepak','Sana','Tariq','Hana','Jin','Leila',
  ];
  const lastNames = [
    'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
    'Tremblay','Gagnon','Roy','Côté','Bouchard','Gauthier','Morin','Lavoie','Fortin','Gagné',
    'Pelletier','Poirier','Bergeron','Leblanc','Paquette','Girard','Simard','Boucher','Caron','Beaulieu',
    'Chen','Singh','Kim','Patel','Nguyen','Ali','Hassan','Wong','Sharma','Khan',
    'Campbell','Stewart','Cooper','Murphy','Sullivan','Mitchell','Thompson','Anderson','Taylor','Wilson',
  ];
  return `${pick(firstNames)} ${pick(lastNames)}`;
}

const LOCATIONS = [
  { city: 'Ottawa', province: 'ON', region: 'NCR' },
  { city: 'Gatineau', province: 'QC', region: 'NCR' },
  { city: 'Toronto', province: 'ON', region: 'Ontario' },
  { city: 'Montréal', province: 'QC', region: 'Quebec' },
  { city: 'Vancouver', province: 'BC', region: 'Western' },
  { city: 'Edmonton', province: 'AB', region: 'Western' },
  { city: 'Winnipeg', province: 'MB', region: 'Prairies' },
  { city: 'Halifax', province: 'NS', region: 'Atlantic' },
  { city: 'Iqaluit', province: 'NU', region: 'Northern' },
  { city: 'Yellowknife', province: 'NT', region: 'Northern' },
];
const LOCATION_WEIGHTS = [0.45, 0.25, 0.06, 0.06, 0.04, 0.03, 0.03, 0.03, 0.025, 0.025];

function pickLocation() {
  let r = rand();
  for (let i = 0; i < LOCATIONS.length; i++) {
    r -= LOCATION_WEIGHTS[i];
    if (r <= 0) return LOCATIONS[i];
  }
  return LOCATIONS[0];
}

const LANGUAGE_PROFILES = ['ENG', 'FRE', 'BBB', 'CBC', 'CCC', 'BCC', 'BCB'];
const LANGUAGE_WEIGHTS = [0.15, 0.10, 0.30, 0.20, 0.10, 0.10, 0.05];

function pickLanguageProfile() {
  let r = rand();
  for (let i = 0; i < LANGUAGE_PROFILES.length; i++) {
    r -= LANGUAGE_WEIGHTS[i];
    if (r <= 0) return LANGUAGE_PROFILES[i];
  }
  return LANGUAGE_PROFILES[0];
}

const TENURE_TYPES = ['Indeterminate', 'Term', 'Casual', 'Student', 'Assignment', 'Secondment'];
const TENURE_WEIGHTS = [0.80, 0.08, 0.03, 0.03, 0.03, 0.03];

const EE_GROUPS = {
  gender: ['Man', 'Woman', 'Non-binary', 'Prefer not to say'],
  genderWeights: [0.45, 0.48, 0.03, 0.04],
  visibleMinority: [true, false],
  vmWeights: [0.22, 0.78],
  indigenous: [true, false],
  indWeights: [0.05, 0.95],
  disability: [true, false],
  disWeights: [0.09, 0.91],
};

function pickFromWeights(options, weights) {
  let r = rand();
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0) return options[i];
  }
  return options[options.length - 1];
}

// ---------------------------------------------------------------------------
// GENERATE FLAT ORG HIERARCHY
// ---------------------------------------------------------------------------
function generateOrgHierarchy() {
  const rows = [];
  for (const branch of BRANCHES) {
    for (const dir of branch.directorates) {
      for (let i = 0; i < dir.divisions.length; i++) {
        rows.push({
          branchCode: branch.branchCode,
          branchName: branch.branchName,
          directorateCode: dir.code,
          directorateName: dir.name,
          divisionCode: `${dir.code}-${String(i + 1).padStart(2, '0')}`,
          divisionName: dir.divisions[i],
          fundCentreCode: `FC-${dir.code}`,
        });
      }
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// GENERATE POSITIONS (~2099)
// ---------------------------------------------------------------------------
const POSITION_TITLES = {
  'AS': ['Administrative Assistant', 'Administrative Officer', 'Executive Assistant', 'Office Manager', 'Administrative Coordinator', 'Records Manager'],
  'CR': ['Data Entry Clerk', 'Registry Clerk', 'Mail & Records Clerk'],
  'EC': ['Economist', 'Policy Analyst', 'Senior Policy Analyst', 'Research Analyst', 'Program Analyst', 'Strategic Advisor', 'Director of Policy'],
  'EX': ['Director', 'Director General', 'Assistant Deputy Minister', 'Executive Director', 'Senior Director'],
  'IS': ['Communications Advisor', 'Web Content Specialist', 'Media Relations Officer', 'Digital Strategist', 'Communications Manager'],
  'IT': ['IT Analyst', 'Systems Administrator', 'Database Analyst', 'IT Project Lead', 'Enterprise Architect', 'Data Engineer'],
  'PC': ['Environmental Scientist', 'Research Scientist', 'Science Advisor'],
  'PE': ['HR Advisor', 'Labour Relations Advisor', 'Classification Advisor', 'Compensation Analyst', 'Staffing Advisor'],
  'PG': ['Procurement Officer', 'Supply Specialist', 'Contracting Officer', 'Procurement Analyst'],
  'PM': ['Program Officer', 'Project Coordinator', 'Program Manager', 'Claims Officer', 'Compliance Officer'],
  'EG': ['Engineering Technician', 'Technical Specialist', 'Field Inspector', 'Quality Assurance Officer'],
  'ENENG': ['Civil Engineer', 'Structural Engineer', 'Project Engineer', 'Environmental Engineer'],
  'FI': ['Financial Analyst', 'Financial Advisor', 'Budget Officer', 'Accounting Officer'],
  'CO': ['Trade Commissioner', 'Commerce Officer', 'Business Analyst'],
};

function generatePositions() {
  const orgRows = generateOrgHierarchy();
  const TARGET_COUNT = 2099;
  const positions = [];

  const branchWeights = {
    'CSB': 0.18, 'PPB': 0.22, 'IPB': 0.25, 'HPB': 0.20, 'CMB': 0.08, 'LSD': 0.04, 'IAB': 0.03
  };

  const directorates = [...new Set(orgRows.map(r => r.directorateCode))];
  let posCounter = 1;

  // DG/Director for each directorate
  for (const dirCode of directorates) {
    const orgRow = orgRows.find(r => r.directorateCode === dirCode);
    const exLevel = dirCode.endsWith('001') ? pick([3, 4]) : pick([1, 2]);
    const posId = `POS-${String(posCounter++).padStart(4, '0')}`;
    const classification = `EX-0${exLevel}`;
    const isVacant = rand() < 0.08;
    const loc = pickLocation();

    positions.push({
      positionId: posId,
      positionTitle: exLevel >= 3 ? 'Director General' : 'Director',
      classificationGroup: 'EX',
      classificationLevel: exLevel,
      classification,
      isEX: true,
      occupancyStatus: isVacant ? 'Vacant' : 'Occupied',
      incumbentName: isVacant ? null : generateName(),
      incumbentId: isVacant ? null : `EMP-${String(posCounter + 5000).padStart(5, '0')}`,
      tenureType: 'Indeterminate',
      startDate: `20${10 + Math.floor(rand() * 14)}-${String(Math.floor(rand() * 12) + 1).padStart(2, '0')}-01`,
      endDate: null,
      languageProfile: pick(['CBC', 'CCC']),
      location: loc,
      branchCode: orgRow.branchCode,
      directorateCode: dirCode,
      divisionCode: orgRow.divisionCode,
      fundCentreCode: `FC-${dirCode}`,
      reportingToPositionId: null,
      fundingSource: 'A-Base',
      fundingSunsetDate: null,
      salary: SALARY_RANGES[classification] || 150000,
      ee_gender: pickFromWeights(EE_GROUPS.gender, EE_GROUPS.genderWeights),
      ee_visibleMinority: pickFromWeights(EE_GROUPS.visibleMinority, EE_GROUPS.vmWeights),
      ee_indigenous: pickFromWeights(EE_GROUPS.indigenous, EE_GROUPS.indWeights),
      ee_disability: pickFromWeights(EE_GROUPS.disability, EE_GROUPS.disWeights),
      isCritical: rand() < 0.3,
      isDoublebanked: false,
    });
  }

  // Generate remaining positions
  while (positions.length < TARGET_COUNT) {
    const orgRow = pick(orgRows);
    const branchWeight = branchWeights[orgRow.branchCode] || 0.1;
    if (rand() > branchWeight * 5) continue;

    const groupCode = pickWeighted(CLASSIFICATION_WEIGHTS);
    if (groupCode === 'EX') continue;
    const group = CLASSIFICATION_GROUPS.find(g => g.code === groupCode);
    if (!group) continue;
    const level = pick(group.levels);
    const classification = `${groupCode}-${String(level).padStart(2, '0')}`;

    const isVacant = rand() < 0.15;
    const isActing = !isVacant && rand() < 0.08;
    const posId = `POS-${String(posCounter++).padStart(4, '0')}`;

    let tenureType = 'Indeterminate';
    if (!isVacant) {
      tenureType = pickFromWeights(TENURE_TYPES, TENURE_WEIGHTS);
    }

    const isTerm = ['Term', 'Casual', 'Student', 'Assignment', 'Secondment'].includes(tenureType);
    const startYear = 2015 + Math.floor(rand() * 10);
    const startMonth = Math.floor(rand() * 12) + 1;
    const startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-01`;

    let endDate = null;
    if (isTerm) {
      const endYear = 2025 + Math.floor(rand() * 3);
      const endMonth = Math.floor(rand() * 12) + 1;
      endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
    }

    const fundingSource = pickWeighted(
      { 'A-Base': 0.60, 'B-Base': 0.20, 'Program': 0.12, 'Sunset': 0.08 }
    );
    let sunsetDate = null;
    if (fundingSource === 'Sunset') {
      sunsetDate = `${2025 + Math.floor(rand() * 4)}-${String(Math.floor(rand() * 12) + 1).padStart(2, '0')}-31`;
    }

    const loc = pickLocation();

    const potentialSupervisors = positions.filter(
      p => p.directorateCode === orgRow.directorateCode && (p.isEX || p.classificationLevel > level)
    );
    const supervisor = potentialSupervisors.length > 0 ? pick(potentialSupervisors) : null;

    positions.push({
      positionId: posId,
      positionTitle: pick(POSITION_TITLES[groupCode] || ['Officer']),
      classificationGroup: groupCode,
      classificationLevel: level,
      classification,
      isEX: false,
      occupancyStatus: isVacant ? 'Vacant' : isActing ? 'Occupied - Acting' : 'Occupied',
      incumbentName: isVacant ? null : generateName(),
      incumbentId: isVacant ? null : `EMP-${String(posCounter + 5000).padStart(5, '0')}`,
      tenureType: isVacant ? null : tenureType,
      startDate: isVacant ? null : startDate,
      endDate,
      languageProfile: pickLanguageProfile(),
      location: loc,
      branchCode: orgRow.branchCode,
      directorateCode: orgRow.directorateCode,
      divisionCode: orgRow.divisionCode,
      fundCentreCode: `FC-${orgRow.directorateCode}`,
      reportingToPositionId: supervisor ? supervisor.positionId : null,
      fundingSource,
      fundingSunsetDate: sunsetDate,
      salary: SALARY_RANGES[classification] || 75000,
      ee_gender: pickFromWeights(EE_GROUPS.gender, EE_GROUPS.genderWeights),
      ee_visibleMinority: pickFromWeights(EE_GROUPS.visibleMinority, EE_GROUPS.vmWeights),
      ee_indigenous: pickFromWeights(EE_GROUPS.indigenous, EE_GROUPS.indWeights),
      ee_disability: pickFromWeights(EE_GROUPS.disability, EE_GROUPS.disWeights),
      isCritical: rand() < 0.1,
      isDoublebanked: rand() < 0.04,
    });
  }

  return positions;
}

// ---------------------------------------------------------------------------
// GENERATE FINANCE DATA
// ---------------------------------------------------------------------------
function generateFinanceData() {
  const orgRows = generateOrgHierarchy();
  const directorates = [...new Map(orgRows.map(r => [r.directorateCode, r])).values()];
  const financeRows = [];

  for (const dir of directorates) {
    const dirScale = 0.5 + rand() * 2;

    const salBudget = Math.round((2000000 + rand() * 8000000) * dirScale);
    const salForecast = Math.round(salBudget * (0.85 + rand() * 0.20));
    const salActuals = Math.round(salForecast * (0.55 + rand() * 0.35));
    const salCommitments = Math.round((salForecast - salActuals) * (0.3 + rand() * 0.4));

    financeRows.push({
      directorateCode: dir.directorateCode,
      directorateName: dir.directorateName,
      fundCentreCode: `FC-${dir.directorateCode}`,
      voteType: 'Salary',
      budget: salBudget,
      forecast: salForecast,
      actuals: salActuals,
      commitments: salCommitments,
      freeBalance: salForecast - salActuals - salCommitments,
      p6Forecast: Math.round(salForecast * (0.95 + rand() * 0.10)),
      priorYearActuals: Math.round(salBudget * (0.88 + rand() * 0.10)),
      fiscalYear: '2025-26',
    });

    const omBudget = Math.round((500000 + rand() * 3000000) * dirScale);
    const omForecast = Math.round(omBudget * (0.80 + rand() * 0.25));
    const omActuals = Math.round(omForecast * (0.40 + rand() * 0.40));
    const omCommitments = Math.round((omForecast - omActuals) * (0.2 + rand() * 0.5));

    financeRows.push({
      directorateCode: dir.directorateCode,
      directorateName: dir.directorateName,
      fundCentreCode: `FC-${dir.directorateCode}`,
      voteType: 'O&M',
      budget: omBudget,
      forecast: omForecast,
      actuals: omActuals,
      commitments: omCommitments,
      freeBalance: omForecast - omActuals - omCommitments,
      p6Forecast: Math.round(omForecast * (0.93 + rand() * 0.14)),
      priorYearActuals: Math.round(omBudget * (0.82 + rand() * 0.15)),
      fiscalYear: '2025-26',
    });

    if (rand() < 0.4) {
      const capBudget = Math.round((100000 + rand() * 2000000) * dirScale);
      const capForecast = Math.round(capBudget * (0.70 + rand() * 0.35));
      const capActuals = Math.round(capForecast * (0.30 + rand() * 0.45));
      const capCommitments = Math.round((capForecast - capActuals) * (0.2 + rand() * 0.5));

      financeRows.push({
        directorateCode: dir.directorateCode,
        directorateName: dir.directorateName,
        fundCentreCode: `FC-${dir.directorateCode}`,
        voteType: 'Capital',
        budget: capBudget,
        forecast: capForecast,
        actuals: capActuals,
        commitments: capCommitments,
        freeBalance: capForecast - capActuals - capCommitments,
        p6Forecast: Math.round(capForecast * (0.90 + rand() * 0.15)),
        priorYearActuals: Math.round(capBudget * (0.75 + rand() * 0.20)),
        fiscalYear: '2025-26',
      });
    }
  }

  return financeRows;
}

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------
export const ORG_HIERARCHY = generateOrgHierarchy();
export const POSITIONS = generatePositions();
export const FINANCE_DATA = generateFinanceData();
export { CLASSIFICATION_GROUPS, SALARY_RANGES, BRANCHES };
