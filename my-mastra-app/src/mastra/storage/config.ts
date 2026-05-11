import { URL } from 'node:url';
import { PostgresStore } from '@mastra/pg';

export function validateDatabaseUrl(raw: string | undefined): string {
  if (!raw) {
    throw new Error('DATABASE_URL missing');
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }

  const host = parsed.hostname;
  const port = parsed.port || '5432';
  const isDirectSupabase = host.startsWith('db.') && host.endsWith('.supabase.co');
  const isPooler = host.includes('.pooler.supabase.com');
  const isIPv6Host = host.includes(':');

  // eslint-disable-next-line no-console
  console.log('[db-config]', {
    cwd: process.cwd(),
    host,
    port,
    protocol: parsed.protocol,
    isDirectSupabase,
    isPooler,
    isIPv6Host,
    node: process.version,
  });

  if (isDirectSupabase) {
    // eslint-disable-next-line no-console
    console.warn(
      '[db-config] Direct Supabase host detected (db.*.supabase.co is AAAA-only). ' +
        'This may fail on IPv4-only networks with ENETUNREACH. ' +
        'Prefer Session Pooler (aws-0-<region>.pooler.supabase.com:6543) for staging/prod, ' +
        'or 127.0.0.1:54322 for local dev.',
    );
  }

  return raw;
}

export function createPostgresStore(): PostgresStore {
  const connectionString = validateDatabaseUrl(process.env.DATABASE_URL);
  return new PostgresStore({
    id: 'mdeai-storage',
    connectionString,
  });
}
