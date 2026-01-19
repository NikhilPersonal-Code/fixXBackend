import { Request, Response } from 'express';

export const test = async (req: Request, res: Response) => {
  res.json({ users: 'this is local test endpoint', status: 'ok' });
};

