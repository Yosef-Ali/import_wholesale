const _fmtPlain = new Intl.NumberFormat('en-ET', { maximumFractionDigits: 0 });
const _fmtCurrency = new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 });

/** Format a number as compact ETB (e.g. ETB 4.2M, ETB 320K) */
export function fmtETBCompact(val: number): string {
  if (val >= 1_000_000) return `ETB ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `ETB ${(val / 1_000).toFixed(0)}K`;
  return `ETB ${_fmtPlain.format(val)}`;
}

/** Format a number as full ETB currency string */
export function fmtETB(val: number): string {
  return _fmtCurrency.format(val);
}

/** Format a plain number with ETB prefix (no currency symbol duplication) */
export function fmtETBPlain(val: number): string {
  return `ETB ${_fmtPlain.format(val)}`;
}
