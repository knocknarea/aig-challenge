import Fastify from 'fastify';
import cors from '@fastify/cors';
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { QuoteRequestSchema } from 'shared';
import { loadKb } from 'engine';
import { calculateQuote } from 'engine';

const kb = loadKb();

export function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(cors, { origin: true });

  app.get('/health', async () => ({
    status: 'ok',
    kbVersion: kb.version,
  }));

  app.post('/policy/quote', {
    schema: { body: QuoteRequestSchema },
  }, async (request) => {
    return calculateQuote(request.body, kb);
  });

  return app;
}
