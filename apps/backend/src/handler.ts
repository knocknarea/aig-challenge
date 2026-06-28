import awsLambdaFastify from '@fastify/aws-lambda';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { buildApp } from './app';
import { KbManager } from './kb-manager';

// Cold start: load KB once. No startWatching() — Lambda execution context is frozen between invocations.
const kbManager = new KbManager();
const proxy = awsLambdaFastify(buildApp(kbManager));

export const handler = (event: APIGatewayProxyEvent, context: Context) =>
  proxy(event, context);
