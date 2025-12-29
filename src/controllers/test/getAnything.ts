import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { sql } from 'drizzle-orm';

export const getAnything = async (req: Request, res: Response) => {
  if (!req.body.query) {
    return res.status(400).json({ message: 'No query provided' });
  }

  console.log(req.body);
  const rows = await db.execute(sql.raw(req.body.query));
  res.json({ data: rows.rows });
};
