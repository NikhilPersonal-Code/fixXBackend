import { AuthRequest } from '@/types/request';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not Authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded as { userId: string };
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;
