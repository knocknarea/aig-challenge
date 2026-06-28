import { z } from 'zod';

export const HealthLiveResponseSchema = z.object({
  status: z.literal('alive'),
  uptime: z.number(),
});

export const HealthReadyOkResponseSchema = z.object({
  status: z.literal('ready'),
  uptime: z.number(),
  kb: z.object({
    version: z.string(),
    loadedAt: z.string(), // ISO date string on the wire
  }),
});

// path is deliberately omitted from all health responses —
// exposing the KB file path would leak server directory structure.
export const HealthReadyDegradedResponseSchema = z.object({
  status: z.literal('degraded'),
  uptime: z.number(),
  kb: z.object({
    lastGoodVersion: z.string(),
    lastGoodAt: z.string(), // ISO date string on the wire
    errorReason: z.string(),
  }),
});

export type HealthLiveResponse = z.infer<typeof HealthLiveResponseSchema>;
export type HealthReadyOkResponse = z.infer<typeof HealthReadyOkResponseSchema>;
export type HealthReadyDegradedResponse = z.infer<typeof HealthReadyDegradedResponseSchema>;
