import { app } from '../server/app';
import { runExpress } from '../server/serverless';

export default function handler(req: any, res: any) {
  req.url = '/products';
  req.originalUrl = '/api/products';
  return runExpress(app, req, res);
}
