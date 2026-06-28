import { z } from 'zod';

export const LeafConditionSchema = z.discriminatedUnion('operator', [
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

export type LeafCondition = z.infer<typeof LeafConditionSchema>;

// Declared manually to break the z.infer circularity introduced by z.lazy().
export type KbCondition =
  | LeafCondition
  | { operator: 'and'; conditions: KbCondition[] }
  | { operator: 'or';  conditions: KbCondition[] }
  | { operator: 'not'; condition:  KbCondition    };

// z.lazy() lives here at the top level. The named compound schemas below reference
// KbConditionSchema directly — they are declared after this const, which is safe
// because the lazy callback is only invoked at first parse time, not at definition time.
export const KbConditionSchema: z.ZodType<KbCondition> = z.lazy(() =>
  z.union([
    LeafConditionSchema,
    AndConditionSchema,
    OrConditionSchema,
    NotConditionSchema,
  ])
);

export const AndConditionSchema = z.object({
  operator: z.literal('and'),
  conditions: z.array(KbConditionSchema),
});

export const OrConditionSchema = z.object({
  operator: z.literal('or'),
  conditions: z.array(KbConditionSchema),
});

export const NotConditionSchema = z.object({
  operator: z.literal('not'),
  condition: KbConditionSchema,
});

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

export type KbFactor = z.infer<typeof KbFactorSchema>;
export type KbRiskBand = z.infer<typeof KbRiskBandSchema>;
export type Kb = z.infer<typeof KbSchema>;
export type RiskBand = keyof typeof KbSchema.shape.riskBands.shape;
