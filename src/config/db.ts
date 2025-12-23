import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { dbConfig } from '@constants/common';
import * as schema from '@db/schema';

const pool = new Pool(dbConfig);

const db = drizzle(pool, { schema });

export default db;
