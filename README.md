# HICC Workforce BI Tool

Integrated HR + Finance workforce planning dashboard for Housing, Infrastructure and Communities Canada (HICC), Corporate Services Branch.

## Overview

A React dashboard prototype that combines HR position data (MyGCHR structure) with Finance fund centre data (SAP structure) into a single self-serve tool. Uses synthetic data for demonstration; designed for easy swap to real data sources.

## Tech Stack

- **React 18** (Vite)
- **Recharts** — charts and visualizations
- **lodash** — utilities
- **d3** — scales/formatting (optional)
- **lucide-react** — icons

## Setup

```bash
cd hicc-workforce-bi
npm install
npm run dev
```

## Project Structure

```
hicc-workforce-bi/
├── src/
│   ├── data/
│   │   └── generateData.js   # Synthetic data generator (ORG_HIERARCHY, POSITIONS, FINANCE_DATA)
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.js
```

## Data Integration

See the comment block at the top of `src/data/generateData.js` for:

- Source mapping (MyGCHR, SAP, etc.)
- Join keys (position ↔ fund centre ↔ org)
- Schema documentation

## Design

Follows the **Aurora Design System** (Government of Canada). Fonts: Rubik (headings), Nunito Sans (body).

## License

Internal prototype — HICC Corporate Services Branch.
