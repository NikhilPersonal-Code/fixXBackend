import { type Request as OldRequest } from 'express';
declare module 'express' {
  interface Request extends OldRequest {
    params: {
      [key: string]: string;
    };
  }
}
