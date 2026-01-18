import { Request, Response } from 'express';

export const userTokenValidCheck = async (_: Request, res: Response) => {
  return res
    .json({
      success: true,
      message: 'Token is valid',
    })
    .status(200);
};
