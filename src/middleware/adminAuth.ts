import { AuthRequest } from '@/types/request';
import { checkUserBlockStatus } from '@/middleware/checkUserBlockedStatus';
import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';

const adminAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const accessTokenHash = req.header('Authorization')?.split(' ')[1];

  if (!accessTokenHash)
    return res.status(401).json({ message: 'Not Authorized Admin' });

  try {
    const isValid = await bcrypt.compare(
      process.env.BACKEND_ACCESS_TOKEN || '',
      accessTokenHash,
    );
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default adminAuthMiddleware;
