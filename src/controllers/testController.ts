import { Request, Response } from 'express';
import db from '@config/dbConfig';
import { sql } from 'drizzle-orm';
import { categories } from '@db/tables';

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

export const prepopulateData = async (req: Request, res: Response) => {
  db.insert(categories).values([
    { categoryName: 'Cleaning' },
    { categoryName: 'Handy person' },
    { categoryName: 'Assembly' },
    { categoryName: 'Transport and Removals' },
    { categoryName: 'Rrepairs' },
    { categoryName: 'Painting' },
    { categoryName: 'Electrical' },
    { categoryName: 'Plumbing' },
    { categoryName: 'Gardening' },
    { categoryName: 'Plant' },
    { categoryName: 'Care' },
    { categoryName: 'Shopping' },
    { categoryName: 'Delivery' },
    { categoryName: 'Packing and Lifting' },
    { categoryName: 'Errands' },
    { categoryName: 'Ironing' },
    { categoryName: 'Alteration' },
    { categoryName: 'Pet Care' },
    { categoryName: 'Translation' },
    { categoryName: 'Photography' },
    { categoryName: 'Tutoring' },
    { categoryName: 'Online' },
    { categoryName: 'Design' },
    { categoryName: 'Cooking' },
    { categoryName: 'Events' },
    { categoryName: 'Others' },
  ]);
};
