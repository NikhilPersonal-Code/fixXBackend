import { PoolConfig } from 'pg';

export const dbConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if connection not established
  // SSL for remote databases (Railway, Supabase, etc.)
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
};

export const DAY_IN_SECONDS = 86400 * 1000;