import 'server-only';

import { appEnv } from '@/app/lib/app-env';

const resolvedMongoUri =
  appEnv === 'live'
    ? process.env.MONGODB_URI_LIVE ?? process.env.MONGODB_URI
    : process.env.MONGODB_URI_TEST;

const resolvedPrismaDatabaseUrl =
  appEnv === 'live'
    ? process.env.DATABASE_URL_LIVE ?? process.env.DATABASE_URL
    : process.env.DATABASE_URL_TEST;

if (!resolvedMongoUri) {
  throw new Error(`Missing Mongo URI for ${appEnv} environment.`);
}

if (!resolvedPrismaDatabaseUrl) {
  throw new Error(`Missing Prisma database URL for ${appEnv} environment.`);
}

export const mongoUri: string = resolvedMongoUri;
export const prismaDatabaseUrl: string = resolvedPrismaDatabaseUrl;
export const mongoDbName: string =
  appEnv === 'live' ? 'Products' : 'TestProducts';
