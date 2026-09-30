import { Pool, type QueryResult, type QueryResultRow } from "pg";

declare global {
  var __elPool: Pool | undefined;
  var __elSchemaReady: Promise<void> | undefined;
}

function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL no está configurada. La base se inyecta al publicar la app.",
    );
  }
  if (!globalThis.__elPool) {
    globalThis.__elPool = new Pool({
      connectionString: url,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }
  return globalThis.__elPool;
}

export async function ensureSchema(): Promise<void> {
  if (!globalThis.__elSchemaReady) {
    globalThis.__elSchemaReady = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS entendimientos (
          id UUID PRIMARY KEY,
          empresa TEXT NOT NULL,
          periodo TEXT NOT NULL DEFAULT '',
          fecha TEXT NOT NULL DEFAULT '',
          vertical TEXT NOT NULL DEFAULT '',
          total DOUBLE PRECISION,
          semaforo_general TEXT NOT NULL DEFAULT 'x',
          modo TEXT NOT NULL DEFAULT '',
          diagnostico TEXT NOT NULL DEFAULT '',
          conteo JSONB NOT NULL DEFAULT '{"g":0,"y":0,"r":0,"x":0}'::jsonb,
          sponsor JSONB,
          caso JSONB NOT NULL DEFAULT '{"modelo":[],"impacto":[],"founders":[],"links":[]}'::jsonb,
          sections JSONB NOT NULL DEFAULT '{}'::jsonb,
          validacion JSONB NOT NULL DEFAULT '{"expertos":[],"clientes":[],"inversionistas":[]}'::jsonb,
          apuesta JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_by_email TEXT,
          created_by_user_id TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    })();
  }
  await globalThis.__elSchemaReady;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  await ensureSchema();
  return getPool().query<T>(text, params);
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
