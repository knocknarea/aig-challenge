import awsLambdaFastify from '@fastify/aws-lambda';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { buildApp } from './app';

const proxy = awsLambdaFastify(buildApp());

export const handler = (event: APIGatewayProxyEvent, context: Context) =>
  proxy(event, context);
