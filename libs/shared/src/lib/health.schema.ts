import { z } from 'zod';

export const HealthLiveResponseSchema = z.object({
  status: z.literal('alive'),
  uptime: z.number(),
});

export const EcsMetadataSchema = z.object({
  cluster: z.string(),
  taskArn: z.string(),
  taskFamily: z.string(),
  taskRevision: z.string(),
});

export const HealthReadyOkResponseSchema = z.object({
  status: z.literal('ready'),
  uptime: z.number(),
  kb: z.object({
    version: z.string(),
    loadedAt: z.string(), // ISO date string on the wire
  }),
  ecs: EcsMetadataSchema.optional(),
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
  ecs: EcsMetadataSchema.optional(),
});

export type HealthLiveResponse = z.infer<typeof HealthLiveResponseSchema>;
export type EcsMetadata = z.infer<typeof EcsMetadataSchema>;
export type HealthReadyOkResponse = z.infer<typeof HealthReadyOkResponseSchema>;
export type HealthReadyDegradedResponse = z.infer<typeof HealthReadyDegradedResponseSchema>;
