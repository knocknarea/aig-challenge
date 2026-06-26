import { KbCondition } from 'shared';
import { ConditionStrategy, operatorStrategies } from './operator-strategies';

export function evaluateCondition(condition: KbCondition, input: Record<string, unknown>): boolean {
  const value = input[condition.field];

  // TypeScript cannot statically correlate the runtime operator key with the condition
  // shape at the dispatch site ("correlated unions" limitation). Safety is guaranteed
  // structurally by `satisfies StrategyMap` at definition time. Method bivariance
  // allows the single cast without an `unknown` intermediate.
  const strategy = operatorStrategies[condition.operator] as ConditionStrategy<KbCondition['operator']>;
  return strategy.evaluate(condition, value);
}
