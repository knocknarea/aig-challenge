import { KbCondition, LeafCondition } from 'shared';
import { ConditionStrategy, operatorStrategies } from './operator-strategies';

export function evaluateCondition(condition: KbCondition, input: Record<string, unknown>): boolean {
  if (condition.operator === 'and') {
    return condition.conditions.every(c => evaluateCondition(c, input));
  }
  if (condition.operator === 'or') {
    return condition.conditions.some(c => evaluateCondition(c, input));
  }
  if (condition.operator === 'not') {
    return !evaluateCondition(condition.condition, input);
  }

  // TypeScript narrows condition to LeafCondition here.
  // The correlated union between operator key and condition shape cannot be
  // expressed statically; safety is guaranteed structurally by `satisfies StrategyMap`
  // at definition time. Method bivariance allows the cast without an `unknown` intermediate.
  const value = input[condition.field];
  const strategy = operatorStrategies[condition.operator] as ConditionStrategy<LeafCondition['operator']>;
  return strategy.evaluate(condition, value);
}
