import { PostgresStore } from '@mastra/pg';

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Mastra: required env var ${name} is not set`);
  return val;
}

export function createPostgresStore(): PostgresStore {
  const connectionString = requireEnv('DATABASE_URL');
  return new PostgresStore({
    id: 'mdeai-storage',
    connectionString,
  });
}
