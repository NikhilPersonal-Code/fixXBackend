import { Request, Response } from 'express';
import db from '@config/dbConfig';

export const getUsers = async (req: Request, res: Response) => {
  const rows = await db.query.users.findMany();
  res.json({ users: rows });
};
