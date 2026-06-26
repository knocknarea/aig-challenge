import { KbCondition } from 'shared';

export function evaluateCondition(condition: KbCondition, input: Record<string, unknown>): boolean {
  const value = input[condition.field];

  switch (condition.operator) {
    case 'eq':
      return value === condition.value;
    case 'gt':
      return typeof value === 'number' && value > condition.value;
    case 'gte':
      return typeof value === 'number' && value >= condition.value;
    case 'lt':
      return typeof value === 'number' && value < condition.value;
    case 'lte':
      return typeof value === 'number' && value <= condition.value;
    case 'between':
      return typeof value === 'number' && value >= condition.min && value <= condition.max;
    case 'outside_range':
      return typeof value === 'number' && (value < condition.min || value > condition.max);
    case 'starts_with':
      return typeof value === 'string' && value.toUpperCase().startsWith(condition.value.toUpperCase());
    case 'starts_with_any':
      return typeof value === 'string' && condition.values.some(
        (prefix) => value.toUpperCase().startsWith(prefix.toUpperCase())
      );
  }
}
