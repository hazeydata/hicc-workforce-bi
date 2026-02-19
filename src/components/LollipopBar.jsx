import { fmtK } from '../utils/formatters';

/**
 * Lollipop bar shape for Recharts BarChart.
 * Renders a thin stem with a pill-shaped head containing the value label.
 * Use for vertical bar charts to reduce ink-to-data ratio.
 *
 * @param {string} format - 'currency' | 'number' | 'percent'
 */
export default function LollipopBar(props) {
  const { x, y, width, height, payload, dataKey, fill, format = 'number' } = props;
  const value = payload[dataKey];
  const label =
    format === 'currency'
      ? fmtK(value)
      : format === 'percent'
        ? (value != null ? Number(value).toFixed(1) : '—') + '%'
        : value != null
          ? String(value)
          : '—';
  const cx = x + width / 2;
  const stemBottom = y + height;
  const pillWidth = Math.max(40, Math.min(56, label.length * 7));
  const pillHeight = 26;
  const rx = pillHeight / 2;
  const pillLeft = cx - pillWidth / 2;
  const pillTop = y - pillHeight;
  const stemTop = y - pillHeight;
  return (
    <g>
      <line x1={cx} y1={stemBottom} x2={cx} y2={stemTop} stroke={fill} strokeWidth={2} />
      <rect x={pillLeft} y={pillTop} width={pillWidth} height={pillHeight} rx={rx} ry={rx} fill={fill} stroke="#fff" strokeWidth={1.5} />
      <text x={cx} y={y - pillHeight / 2} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={11} fontWeight={700} fontFamily="Nunito Sans">
        {label}
      </text>
    </g>
  );
}
