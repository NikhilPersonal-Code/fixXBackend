import db from '@config/db';
import { sql } from 'drizzle-orm';

export const testConnection = async () => {
  try {
    const result = await db.execute(sql`SELECT 1 as connected`);
    console.log('✅ Database connected successfully');
    return result;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};
