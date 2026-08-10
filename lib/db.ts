import { Pool, QueryResult } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgres://asus@127.0.0.1:5434/postgres';

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

/**
 * Execute a SQL query within a PostgreSQL transaction where Row-Level Security (RLS)
 * session context variables (app.current_user_id and app.current_user_role) are set.
 *
 * Uses PostgreSQL native set_config(setting, value, is_local) to ensure parameterized bindings work cleanly.
 */
export async function executeWithRLS<T = any>(
  userId: string,
  role: string,
  sql: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    
    // Set transaction-local session context variables for RLS evaluation
    await client.query(`SELECT set_config('app.current_user_id', $1, true);`, [userId]);
    await client.query(`SELECT set_config('app.current_user_role', $1, true);`, [role]);
    
    // Set 5-second statement timeout to kill expensive queries
    await client.query(`SET LOCAL statement_timeout = 5000;`);

    const result = await client.query<T>(sql, params);
    
    await client.query('COMMIT;');
    return result;
  } catch (error) {
    await client.query('ROLLBACK;').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Standard un-scoped query execution for system operations (e.g., auth check, logging)
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<QueryResult<T>> {
  return pool.query<T>(sql, params);
}
