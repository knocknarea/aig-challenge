import { AppliedFactor, Kb, QuoteRequest, QuoteResponse, RiskBand } from 'shared';
import { coerceToNumber } from './coerce-value';
import { evaluateCondition } from './condition-evaluator';

export function calculateQuote(request: QuoteRequest, kb: Kb): QuoteResponse {
  const input = request as unknown as Record<string, unknown>;

  // map: evaluate each KB factor — null means condition did not match
  // filter (type predicate): narrow (AppliedFactor | null)[] → AppliedFactor[]
  // reduce: fold matched factor points into a total risk score
  const appliedFactors: AppliedFactor[] = kb.factors
    .map((factor): AppliedFactor | null => {
      if (!evaluateCondition(factor.condition, input)) return null;
      const fieldValue = input[factor.condition.field];
      const n = factor.perOccurrence ? coerceToNumber(fieldValue) : null;
      const points = n !== null ? factor.points * n : factor.points;
      return { id: factor.id, description: factor.description, points };
    })
    .filter((f): f is AppliedFactor => f !== null);

  const riskScore = appliedFactors.reduce((acc, f) => acc + f.points, 0);

  const { riskBand, riskMultiplier } = resolveRiskBand(riskScore, kb);

  const annualPremium = round2(kb.basePremium * riskMultiplier * kb.coverageLoadFactor);
  const monthlyPremium = round2(annualPremium / 12);

  return {
    monthlyPremium,
    annualPremium,
    riskBand,
    riskScore,
    riskSummary: buildSummary(riskBand, appliedFactors),
    coverageDetails: {
      basePremium: kb.basePremium,
      riskMultiplier,
      coverageLoadFactor: kb.coverageLoadFactor,
      kbVersion: kb.version,
    },
    appliedFactors,
  };
}

function resolveRiskBand(score: number, kb: Kb): { riskBand: RiskBand; riskMultiplier: number } {
  for (const [band, config] of Object.entries(kb.riskBands) as [RiskBand, { min: number; max: number; riskMultiplier: number }][]) {
    if (score >= config.min && score <= config.max) {
      return { riskBand: band, riskMultiplier: config.riskMultiplier };
    }
  }
  return { riskBand: 'HIGH_RISK', riskMultiplier: kb.riskBands.HIGH_RISK.riskMultiplier };
}

function buildSummary(riskBand: RiskBand, appliedFactors: AppliedFactor[]): string {
  if (appliedFactors.length === 0) {
    return 'No elevated risk factors identified. Standard premium applies.';
  }

  const prefix: Record<RiskBand, string> = {
    STANDARD: 'Your property has been assessed as standard risk.',
    ELEVATED: 'Your property has been assessed as elevated risk.',
    HIGH_RISK: 'Your property has been assessed as high risk.',
  };

  const factors = appliedFactors.map((f) => f.description).join('; ');
  return `${prefix[riskBand]} Contributing factors: ${factors}.`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
