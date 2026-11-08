import { app } from '../../server/app';
import { runExpress } from '../../server/serverless';

export default function handler(req: any, res: any) {
  req.url = '/admin/logout';
  req.originalUrl = '/api/admin/logout';
  return runExpress(app, req, res);
}
