import { LeafCondition } from 'shared';
import { coerceToNumber, coerceToString } from './coerce-value';

/**
 * Strategy interface for one leaf operator variant.
 * Method signature (not property function type) is intentional — it enables
 * method bivariance so ConditionStrategy<'eq'> is assignable to
 * ConditionStrategy<LeafCondition['operator']> without an `unknown` intermediate.
 * Compound operators (and, or, not) are not strategies — they are handled by
 * recursive dispatch in condition-evaluator.ts.
 */
export interface ConditionStrategy<Op extends LeafCondition['operator']> {
  evaluate(condition: Extract<LeafCondition, { operator: Op }>, value: unknown): boolean;
}

/**
 * Exhaustive mapped type: every leaf operator must have a strategy entry.
 * Adding a leaf operator to LeafConditionSchema without updating this map = compile error.
 */
export type StrategyMap = {
  [Op in LeafCondition['operator']]: ConditionStrategy<Op>;
};

/**
 * `satisfies StrategyMap` does two things:
 *   1. Exhaustiveness — missing any key is a compile error.
 *   2. Contextual typing — each evaluate() receives the narrowed condition type for
 *      its operator (e.g. 'between' sees condition.min/max, not condition.value).
 */
export const operatorStrategies = {
  eq: {
    evaluate: (c, v) =>
      typeof c.value === 'number'
        ? coerceToNumber(v) === c.value
        : coerceToString(v) === c.value,
  },
  gt: {
    evaluate: (c, v) => { const n = coerceToNumber(v); return n !== null && n > c.value; },
  },
  gte: {
    evaluate: (c, v) => { const n = coerceToNumber(v); return n !== null && n >= c.value; },
  },
  lt: {
    evaluate: (c, v) => { const n = coerceToNumber(v); return n !== null && n < c.value; },
  },
  lte: {
    evaluate: (c, v) => { const n = coerceToNumber(v); return n !== null && n <= c.value; },
  },
  between: {
    evaluate: (c, v) => { const n = coerceToNumber(v); return n !== null && n >= c.min && n <= c.max; },
  },
  outside_range: {
    evaluate: (c, v) => { const n = coerceToNumber(v); return n !== null && (n < c.min || n > c.max); },
  },
  starts_with: {
    evaluate: (c, v) => {
      const s = coerceToString(v);
      return s !== null && s.toUpperCase().startsWith(c.value.toUpperCase());
    },
  },
  starts_with_any: {
    evaluate: (c, v) => {
      const s = coerceToString(v);
      return s !== null && c.values.some(p => s.toUpperCase().startsWith(p.toUpperCase()));
    },
  },
} satisfies StrategyMap;
