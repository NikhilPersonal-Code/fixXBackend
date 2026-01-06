import { Request } from 'express';
import { Task } from './dbTables';

export interface UpdateProfileRequest extends Request {
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
}
export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}
