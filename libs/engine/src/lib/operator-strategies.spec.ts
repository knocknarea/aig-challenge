import { operatorStrategies } from './operator-strategies';

describe('operatorStrategies', () => {
  describe('eq', () => {
    it('matches string equality', () => {
      expect(operatorStrategies.eq.evaluate({ field: 'propertyType', operator: 'eq', value: 'Flat' }, 'Flat')).toBe(true);
    });
    it('rejects non-matching string', () => {
      expect(operatorStrategies.eq.evaluate({ field: 'propertyType', operator: 'eq', value: 'Flat' }, 'House')).toBe(false);
    });
    it('matches numeric equality', () => {
      expect(operatorStrategies.eq.evaluate({ field: 'age', operator: 'eq', value: 30 }, 30)).toBe(true);
    });
    it('coerces numeric string to number for numeric condition', () => {
      expect(operatorStrategies.eq.evaluate({ field: 'age', operator: 'eq', value: 30 }, '30')).toBe(true);
    });
    it('coerces number to string for string condition', () => {
      expect(operatorStrategies.eq.evaluate({ field: 'code', operator: 'eq', value: '42' }, 42)).toBe(true);
    });
    it('returns false for null', () => {
      expect(operatorStrategies.eq.evaluate({ field: 'age', operator: 'eq', value: 30 }, null)).toBe(false);
    });
  });

  describe('gt', () => {
    it('returns true when value exceeds threshold', () => {
      expect(operatorStrategies.gt.evaluate({ field: 'propertyValue', operator: 'gt', value: 750000 }, 800000)).toBe(true);
    });
    it('returns false at exact threshold (strict)', () => {
      expect(operatorStrategies.gt.evaluate({ field: 'propertyValue', operator: 'gt', value: 750000 }, 750000)).toBe(false);
    });
    it('coerces numeric string', () => {
      expect(operatorStrategies.gt.evaluate({ field: 'propertyValue', operator: 'gt', value: 750000 }, '800000')).toBe(true);
    });
    it('returns false for non-numeric string', () => {
      expect(operatorStrategies.gt.evaluate({ field: 'propertyValue', operator: 'gt', value: 750000 }, 'abc')).toBe(false);
    });
  });

  describe('gte', () => {
    it('returns true at exact threshold (inclusive)', () => {
      expect(operatorStrategies.gte.evaluate({ field: 'x', operator: 'gte', value: 10 }, 10)).toBe(true);
    });
    it('returns false below threshold', () => {
      expect(operatorStrategies.gte.evaluate({ field: 'x', operator: 'gte', value: 10 }, 9)).toBe(false);
    });
  });

  describe('lt', () => {
    it('returns true below threshold', () => {
      expect(operatorStrategies.lt.evaluate({ field: 'x', operator: 'lt', value: 10 }, 9)).toBe(true);
    });
    it('returns false at exact threshold (strict)', () => {
      expect(operatorStrategies.lt.evaluate({ field: 'x', operator: 'lt', value: 10 }, 10)).toBe(false);
    });
  });

  describe('lte', () => {
    it('returns true at exact threshold (inclusive)', () => {
      expect(operatorStrategies.lte.evaluate({ field: 'x', operator: 'lte', value: 10 }, 10)).toBe(true);
    });
    it('returns false above threshold', () => {
      expect(operatorStrategies.lte.evaluate({ field: 'x', operator: 'lte', value: 10 }, 11)).toBe(false);
    });
  });

  describe('between', () => {
    const cond = { field: 'previousClaims', operator: 'between' as const, min: 1, max: 2 };

    it('is inclusive on lower bound', () => {
      expect(operatorStrategies.between.evaluate(cond, 1)).toBe(true);
    });
    it('is inclusive on upper bound', () => {
      expect(operatorStrategies.between.evaluate(cond, 2)).toBe(true);
    });
    it('rejects value below range', () => {
      expect(operatorStrategies.between.evaluate(cond, 0)).toBe(false);
    });
    it('rejects value above range', () => {
      expect(operatorStrategies.between.evaluate(cond, 3)).toBe(false);
    });
    it('coerces numeric string', () => {
      expect(operatorStrategies.between.evaluate(cond, '1')).toBe(true);
    });
    it('rejects non-numeric', () => {
      expect(operatorStrategies.between.evaluate(cond, 'two')).toBe(false);
    });
    it('rejects null', () => {
      expect(operatorStrategies.between.evaluate(cond, null)).toBe(false);
    });
  });

  describe('outside_range', () => {
    const cond = { field: 'age', operator: 'outside_range' as const, min: 25, max: 75 };

    it('triggers below min', () => {
      expect(operatorStrategies.outside_range.evaluate(cond, 24)).toBe(true);
    });
    it('triggers above max', () => {
      expect(operatorStrategies.outside_range.evaluate(cond, 76)).toBe(true);
    });
    it('does not trigger at lower bound', () => {
      expect(operatorStrategies.outside_range.evaluate(cond, 25)).toBe(false);
    });
    it('does not trigger at upper bound', () => {
      expect(operatorStrategies.outside_range.evaluate(cond, 75)).toBe(false);
    });
    it('coerces numeric string', () => {
      expect(operatorStrategies.outside_range.evaluate(cond, '20')).toBe(true);
    });
    it('returns false for NaN string', () => {
      expect(operatorStrategies.outside_range.evaluate(cond, 'abc')).toBe(false);
    });
  });

  describe('starts_with', () => {
    const cond = { field: 'postcode', operator: 'starts_with' as const, value: 'SW' };

    it('matches case-insensitively', () => {
      expect(operatorStrategies.starts_with.evaluate(cond, 'sw1a 1aa')).toBe(true);
    });
    it('rejects non-matching prefix', () => {
      expect(operatorStrategies.starts_with.evaluate(cond, 'N1 9GU')).toBe(false);
    });
    it('coerces number to string', () => {
      expect(operatorStrategies.starts_with.evaluate({ field: 'x', operator: 'starts_with', value: '4' }, 42)).toBe(true);
    });
    it('returns false for null', () => {
      expect(operatorStrategies.starts_with.evaluate(cond, null)).toBe(false);
    });
    it('returns false for NaN', () => {
      expect(operatorStrategies.starts_with.evaluate(cond, NaN)).toBe(false);
    });
  });

  describe('starts_with_any', () => {
    const cond = { field: 'postcode', operator: 'starts_with_any' as const, values: ['EX', 'PL', 'TQ'] };

    it('matches any of the prefixes case-insensitively', () => {
      expect(operatorStrategies.starts_with_any.evaluate(cond, 'ex1 2ab')).toBe(true);
      expect(operatorStrategies.starts_with_any.evaluate(cond, 'PL4 8AA')).toBe(true);
    });
    it('rejects non-matching prefix', () => {
      expect(operatorStrategies.starts_with_any.evaluate(cond, 'SW1A 1AA')).toBe(false);
    });
    it('returns false for non-string non-number', () => {
      expect(operatorStrategies.starts_with_any.evaluate(cond, null)).toBe(false);
    });
    it('returns false for Infinity', () => {
      expect(operatorStrategies.starts_with_any.evaluate(cond, Infinity)).toBe(false);
    });
  });
});
