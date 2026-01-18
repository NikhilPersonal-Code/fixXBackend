import { AuthRequest } from '@/types/request';
import { checkUserBlockStatus } from '@/utils/checkUserBlockStatus';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not Authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded as { userId: string };
    const blockedResponse = await checkUserBlockStatus({
      res,
      userId: req.user?.userId,
    });
    if (blockedResponse !== null) {
      return blockedResponse;
    }
    next();
  } catch (error) {
    const err = error as Error;
    console.log(err);
    if (err && err.message.includes('jwt expired')) {
      return res
        .status(401)
        .json({ message: 'Session expired please login again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

export default authMiddleware;
