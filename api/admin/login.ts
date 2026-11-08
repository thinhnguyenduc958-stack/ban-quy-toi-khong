import { app } from '../../server/app';
import { runExpress } from '../../server/serverless';

export default function handler(req: any, res: any) {
  req.url = '/admin/login';
  req.originalUrl = '/api/admin/login';
  return runExpress(app, req, res);
}
