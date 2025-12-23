import { Request, Response, NextFunction } from 'express';

const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-Key');

  if (!apiKey) {
    return res.status(401).json({ message: 'Not Authorized' });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ message: 'Invalid API Key' });
  }

  next(); // API key is valid — continue to the next middleware or route
};

export default apiKeyMiddleware;
