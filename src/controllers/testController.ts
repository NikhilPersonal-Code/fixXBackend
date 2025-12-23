import { Request, Response } from 'express';
import db from '../config/db';
import { sql } from 'drizzle-orm';

export const getUsers = async (req: Request, res: Response) => {
  const rows = await db.query.users.findMany();
  res.json({ users: rows });
};

export const test = async (req: Request, res: Response) => {
  res.json({ users: 'this is local test endpoint', status: 'ok' });
};

export const getAnything = async (req: Request, res: Response) => {
  if (!req.body.query) {
    return res.status(400).json({ message: 'No query provided' });
  }

  console.log(req.body);
  const rows = await db.execute(sql.raw(req.body.query));
  res.json({ data: rows.rows });
};
