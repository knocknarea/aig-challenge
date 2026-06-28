import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  QuoteRequestSchema,
  HealthLiveResponseSchema,
  HealthReadyOkResponseSchema,
  HealthReadyDegradedResponseSchema,
  HealthLiveResponse,
  HealthReadyOkResponse,
  HealthReadyDegradedResponse,
} from 'shared';
import { calculateQuote } from 'engine';
import { KbManager } from './kb-manager';

export function buildApp(kbManager: KbManager) {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(cors, { origin: true });

  app.get('/health/live', {
    schema: { response: { 200: HealthLiveResponseSchema } },
  }, async (): Promise<HealthLiveResponse> => ({
    status: 'alive',
    uptime: process.uptime(),
  }));

  app.get('/health/ready', {
    schema: {
      response: {
        200: HealthReadyOkResponseSchema,
        503: HealthReadyDegradedResponseSchema,
      },
    },
  }, async (_request, reply): Promise<HealthReadyOkResponse | HealthReadyDegradedResponse> => {
    const s = kbManager.getStatus();
    if (s.state === 'ok') {
      return {
        status: 'ready',
        uptime: process.uptime(),
        kb: { version: s.version, loadedAt: s.loadedAt.toISOString() },
      };
    }
    reply.code(503);
    return {
      status: 'degraded',
      uptime: process.uptime(),
      kb: {
        lastGoodVersion: s.lastGoodVersion,
        lastGoodAt: s.lastGoodAt.toISOString(),
        errorReason: s.reason,
      },
    };
  });

  app.post('/policy/quote', {
    schema: { body: QuoteRequestSchema },
  }, async (request) => {
    return calculateQuote(request.body, kbManager.getKb());
  });

  return app;
}
