/**
 * Utility formatters for currency, percentages
 */

export function fmt(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  return sign + '$' + Math.abs(n).toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function fmtK(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return sign + '$' + (abs / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return sign + '$' + Math.round(abs / 1_000) + 'K';
  return sign + '$' + abs.toLocaleString();
}

export function pct(numerator, denominator) {
  if (denominator == null || denominator === 0 || Number.isNaN(denominator)) return '—';
  if (numerator == null || Number.isNaN(numerator)) return '—';
  return ((numerator / denominator) * 100).toFixed(1) + '%';
}
