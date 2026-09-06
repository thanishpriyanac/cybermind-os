/**
 * CYBERMIND OS — RC-002 Database Validation
 *
 * Tests database robustness per RVS-001 Workstream 5.
 * Scenarios:
 * 1. Connection pool exhaustion
 * 2. Transaction rollback verification
 * 3. Deadlock recovery
 * 4. Query latency under concurrent load
 */
import { Client, Pool } from 'pg';

const DB_URL = process.env.DATABASE_URL || 'postgresql://cybermind:cybermind_secret@localhost:5432/cybermind_identity';

describe('WS5: Database Validation', () => {
  let pool: Pool;

  beforeAll(async () => {
    // Standard pool for regular tests
    pool = new Pool({ connectionString: DB_URL, max: 20 });
    
    // Ensure test tables exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_transactions (
        id SERIAL PRIMARY KEY,
        value TEXT
      );
      CREATE TABLE IF NOT EXISTS test_deadlocks_a (
        id SERIAL PRIMARY KEY,
        val INT
      );
      CREATE TABLE IF NOT EXISTS test_deadlocks_b (
        id SERIAL PRIMARY KEY,
        val INT
      );
      INSERT INTO test_deadlocks_a (id, val) VALUES (1, 100) ON CONFLICT (id) DO NOTHING;
      INSERT INTO test_deadlocks_b (id, val) VALUES (1, 100) ON CONFLICT (id) DO NOTHING;
    `);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('handles connection pool exhaustion gracefully', async () => {
    // Create a strict pool with max 2 connections
    const strictPool = new Pool({ connectionString: DB_URL, max: 2, connectionTimeoutMillis: 2000 });
    
    // Acquire 2 connections (exhausting the pool)
    const client1 = await strictPool.connect();
    const client2 = await strictPool.connect();
    
    // Try to acquire a 3rd connection, should throw a timeout error
    let error: Error | null = null;
    try {
      await strictPool.connect();
    } catch (err: any) {
      error = err;
    }
    
    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/timeout/i);
    
    // Release and verify pool recovers
    client1.release();
    client2.release();
    const client3 = await strictPool.connect();
    expect(client3).toBeDefined();
    client3.release();
    await strictPool.end();
  });

  it('verifies transaction rollback on error', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("INSERT INTO test_transactions (value) VALUES ('should_rollback')");
      // Force an error
      await client.query('SELECT * FROM non_existent_table');
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }

    const res = await pool.query("SELECT * FROM test_transactions WHERE value = 'should_rollback'");
    expect(res.rowCount).toBe(0);
  });

  it('recovers from deadlocks automatically', async () => {
    // Simulate a deadlock using two separate clients
    const c1 = await pool.connect();
    const c2 = await pool.connect();

    try {
      await c1.query('BEGIN');
      await c2.query('BEGIN');

      // c1 locks A
      await c1.query('UPDATE test_deadlocks_a SET val = val + 1 WHERE id = 1');
      // c2 locks B
      await c2.query('UPDATE test_deadlocks_b SET val = val + 1 WHERE id = 1');

      // To ensure locks are held before they request each other's locked resources
      await new Promise(r => setTimeout(r, 100));

      // Now create the deadlock
      const p1 = c1.query('UPDATE test_deadlocks_b SET val = val + 1 WHERE id = 1');
      const p2 = c2.query('UPDATE test_deadlocks_a SET val = val + 1 WHERE id = 1');

      let errorDetected = false;
      try {
        await Promise.all([p1, p2]);
      } catch (err: any) {
        errorDetected = true;
        // Postgres error code for deadlock detected is 40P01
        expect(err.code).toBe('40P01');
      }
      expect(errorDetected).toBe(true);

      await c1.query('ROLLBACK');
      await c2.query('ROLLBACK');
    } finally {
      c1.release();
      c2.release();
    }
  });

  it('maintains low query latency under concurrent load', async () => {
    const concurrency = 50;
    const queries = Array.from({ length: concurrency }).map(() => {
      const start = Date.now();
      return pool.query('SELECT 1').then(() => Date.now() - start);
    });

    const latencies = await Promise.all(queries);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    
    // SLO: Latency under load should be well under 50ms for simple queries
    expect(avgLatency).toBeLessThan(50);
  });
});
