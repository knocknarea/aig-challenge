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
import { fetchEcsMetadata } from './ecs-metadata';

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

  const readySchema = {
    response: {
      200: HealthReadyOkResponseSchema,
      503: HealthReadyDegradedResponseSchema,
    },
  };

  async function buildReadyBody(): Promise<
    { body: HealthReadyOkResponse; code: 200 } | { body: HealthReadyDegradedResponse; code: 503 }
  > {
    const s = kbManager.getStatus();
    const ecs = (await fetchEcsMetadata()) ?? undefined;
    if (s.state === 'ok') {
      return {
        code: 200,
        body: {
          status: 'ready',
          uptime: process.uptime(),
          kb: { version: s.version, loadedAt: s.loadedAt.toISOString() },
          ecs,
        } as HealthReadyOkResponse,
      };
    }
    return {
      code: 503,
      body: {
        status: 'degraded',
        uptime: process.uptime(),
        kb: {
          lastGoodVersion: s.lastGoodVersion,
          lastGoodAt: s.lastGoodAt.toISOString(),
          errorReason: s.reason,
        },
        ecs,
      } as HealthReadyDegradedResponse,
    };
  }

  app.get('/health/ready', { schema: readySchema },
    async (_request, reply): Promise<HealthReadyOkResponse | HealthReadyDegradedResponse> => {
      const { code, body } = await buildReadyBody();
      if (code !== 200) reply.code(code);
      return body;
    },
  );

  app.get('/health', { schema: readySchema },  // ALB default probe path — same response as /health/ready
    async (_request, reply): Promise<HealthReadyOkResponse | HealthReadyDegradedResponse> => {
      const { code, body } = await buildReadyBody();
      if (code !== 200) reply.code(code);
      return body;
    },
  );

  app.post('/policy/quote', {
    schema: { body: QuoteRequestSchema },
  }, async (request) => {
    return calculateQuote(request.body, kbManager.getKb());
  });

  return app;
}
