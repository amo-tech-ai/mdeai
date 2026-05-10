export interface HealthResponse {
  ok: boolean;
  version: string;
  storage: string;
  ts: string;
}

export function getHealth(): HealthResponse {
  return {
    ok: true,
    version: '1.0.0',
    storage: 'postgres',
    ts: new Date().toISOString(),
  };
}
