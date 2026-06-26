import { z } from 'zod';

export const QuoteRequestSchema = z.object({
  customerName: z.string().min(1, 'Name is required'),
  age: z.number().int().min(18, 'Must be at least 18').max(120, 'Invalid age'),
  propertyType: z.enum(['House', 'Flat', 'Bungalow']),
  propertyValue: z.number().positive('Property value must be positive'),
  postcode: z.string().min(1, 'Postcode is required'),
  previousClaims: z.number().int().min(0, 'Cannot be negative'),
});

export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

export interface AppliedFactor {
  id: string;
  description: string;
  points: number;
}

export interface CoverageDetails {
  basePremium: number;
  riskMultiplier: number;
  coverageLoadFactor: number;
  kbVersion: string;
}

export interface QuoteResponse {
  monthlyPremium: number;
  annualPremium: number;
  riskBand: 'STANDARD' | 'ELEVATED' | 'HIGH_RISK';
  riskScore: number;
  riskSummary: string;
  coverageDetails: CoverageDetails;
  appliedFactors: AppliedFactor[];
}
