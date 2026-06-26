import { calculateQuote } from './risk-engine';
import { Kb, QuoteRequest } from 'shared';

const TEST_KB: Kb = {
  version: '1.0.0',
  basePremium: 300,
  coverageLoadFactor: 1.2,
  riskBands: {
    STANDARD: { min: 0, max: 25, riskMultiplier: 1.0 },
    ELEVATED: { min: 26, max: 60, riskMultiplier: 1.5 },
    HIGH_RISK: { min: 61, max: 999, riskMultiplier: 2.2 },
  },
  factors: [
    {
      id: 'age_young_elderly',
      description: 'Under 25 or over 75',
      condition: { field: 'age', operator: 'outside_range', min: 25, max: 75 },
      points: 20,
    },
    {
      id: 'previous_claims_low',
      description: '1–2 previous claims',
      condition: { field: 'previousClaims', operator: 'between', min: 1, max: 2 },
      points: 15,
      perOccurrence: true,
    },
    {
      id: 'previous_claims_high',
      description: '3 or more previous claims',
      condition: { field: 'previousClaims', operator: 'gte', value: 3 },
      points: 30,
      perOccurrence: true,
    },
    {
      id: 'property_type_flat',
      description: 'Flat — higher shared risk',
      condition: { field: 'propertyType', operator: 'eq', value: 'Flat' },
      points: 10,
    },
    {
      id: 'property_value_high',
      description: 'Property value over £750,000',
      condition: { field: 'propertyValue', operator: 'gt', value: 750000 },
      points: 25,
    },
  ],
};

const BASE_REQUEST: QuoteRequest = {
  customerName: 'Test User',
  age: 35,
  propertyType: 'House',
  propertyValue: 300000,
  postcode: 'SW1A 1AA',
  previousClaims: 0,
};

describe('calculateQuote', () => {
  it('returns STANDARD band for a low-risk applicant', () => {
    const result = calculateQuote(BASE_REQUEST, TEST_KB);

    expect(result.riskBand).toBe('STANDARD');
    expect(result.riskScore).toBe(0);
    expect(result.appliedFactors).toHaveLength(0);
    expect(result.annualPremium).toBe(360); // 300 * 1.0 * 1.2
    expect(result.monthlyPremium).toBe(30);
  });

  it('returns ELEVATED band when risk score is 26–60', () => {
    // Age outside range (20 pts) + flat (10 pts) = 30 pts → ELEVATED
    const result = calculateQuote(
      { ...BASE_REQUEST, age: 22, propertyType: 'Flat' },
      TEST_KB,
    );

    expect(result.riskBand).toBe('ELEVATED');
    expect(result.riskScore).toBe(30);
    expect(result.appliedFactors).toHaveLength(2);
    expect(result.annualPremium).toBe(540); // 300 * 1.5 * 1.2
  });

  it('returns HIGH_RISK band when risk score is 61+', () => {
    // Age outside range (20 pts) + 3 claims perOccurrence (3 * 30 = 90 pts) = 110 pts → HIGH_RISK
    const result = calculateQuote(
      { ...BASE_REQUEST, age: 80, previousClaims: 3 },
      TEST_KB,
    );

    expect(result.riskBand).toBe('HIGH_RISK');
    expect(result.riskScore).toBeGreaterThanOrEqual(61);
    expect(result.annualPremium).toBe(792); // 300 * 2.2 * 1.2
  });

  it('applies perOccurrence multiplier for claims', () => {
    // 2 claims, perOccurrence: 2 * 15 = 30 pts → ELEVATED
    const result = calculateQuote(
      { ...BASE_REQUEST, previousClaims: 2 },
      TEST_KB,
    );

    const claimsFactor = result.appliedFactors.find((f) => f.id === 'previous_claims_low');
    expect(claimsFactor).toBeDefined();
    expect(claimsFactor!.points).toBe(30);
    expect(result.riskBand).toBe('ELEVATED');
  });

  it('includes coverage details with kb version', () => {
    const result = calculateQuote(BASE_REQUEST, TEST_KB);

    expect(result.coverageDetails.kbVersion).toBe('1.0.0');
    expect(result.coverageDetails.basePremium).toBe(300);
    expect(result.coverageDetails.coverageLoadFactor).toBe(1.2);
  });
});
