import { app } from '../server/app';
import { runExpress } from '../server/serverless';

export default function handler(req: any, res: any) {
  req.url = '/categories';
  req.originalUrl = '/api/categories';
  return runExpress(app, req, res);
}
