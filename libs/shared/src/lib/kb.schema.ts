import { z } from 'zod';

export const KbConditionSchema = z.discriminatedUnion('operator', [
  z.object({ field: z.string(), operator: z.literal('eq'), value: z.union([z.string(), z.number()]) }),
  z.object({ field: z.string(), operator: z.literal('gt'), value: z.number() }),
  z.object({ field: z.string(), operator: z.literal('gte'), value: z.number() }),
  z.object({ field: z.string(), operator: z.literal('lt'), value: z.number() }),
  z.object({ field: z.string(), operator: z.literal('lte'), value: z.number() }),
  z.object({ field: z.string(), operator: z.literal('between'), min: z.number(), max: z.number() }),
  z.object({ field: z.string(), operator: z.literal('outside_range'), min: z.number(), max: z.number() }),
  z.object({ field: z.string(), operator: z.literal('starts_with'), value: z.string() }),
  z.object({ field: z.string(), operator: z.literal('starts_with_any'), values: z.array(z.string()) }),
]);

export const KbFactorSchema = z.object({
  id: z.string(),
  description: z.string(),
  condition: KbConditionSchema,
  points: z.number(),
  perOccurrence: z.boolean().optional(),
});

export const KbRiskBandSchema = z.object({
  min: z.number(),
  max: z.number(),
  riskMultiplier: z.number(),
});

export const KbSchema = z.object({
  version: z.string(),
  basePremium: z.number().positive(),
  coverageLoadFactor: z.number().positive(),
  riskBands: z.object({
    STANDARD: KbRiskBandSchema,
    ELEVATED: KbRiskBandSchema,
    HIGH_RISK: KbRiskBandSchema,
  }),
  factors: z.array(KbFactorSchema),
});

export type KbCondition = z.infer<typeof KbConditionSchema>;
export type KbFactor = z.infer<typeof KbFactorSchema>;
export type KbRiskBand = z.infer<typeof KbRiskBandSchema>;
export type Kb = z.infer<typeof KbSchema>;
export type RiskBand = keyof typeof KbSchema.shape.riskBands.shape;
