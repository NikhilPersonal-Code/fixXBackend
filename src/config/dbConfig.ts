import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { dbConfig } from '@constants/common';
import * as schema from '@db/tables';

const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't crash the server, just log the error
});

// Optional: Log when a client is acquired/released
pool.on('connect', () => {
  console.log('Database client connected');
});

const db = drizzle(pool, { schema });

export default db;
