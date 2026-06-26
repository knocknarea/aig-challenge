/**
 * Normalises an unknown input value to a number.
 * Accepts: number literals, numeric strings ("25", "1.5").
 * Rejects: NaN, booleans, null, objects — returns null so callers can
 * distinguish "value present but wrong type" from "value is zero".
 */
export function coerceToNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/**
 * Normalises an unknown input value to a string.
 * Accepts: string literals, finite numbers (42 → "42").
 * Rejects: NaN, Infinity, null, objects — returns null.
 * Bidirectional with coerceToNumber: a numeric field arriving as either
 * type can be compared against a string condition value, and vice versa.
 */
export function coerceToString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}
