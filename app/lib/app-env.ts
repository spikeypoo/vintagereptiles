import 'server-only';

export const appEnv = process.env.APP_ENV === 'live' ? 'live' : 'test';
