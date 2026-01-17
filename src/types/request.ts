import { Request } from 'express';

export interface UpdateProfileRequest extends Request {
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
}
export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}
