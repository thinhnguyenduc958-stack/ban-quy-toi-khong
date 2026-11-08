import { app } from '../../server/app';
import { runExpress } from '../../server/serverless';

export default function handler(req: any, res: any) {
  req.url = '/admin/session';
  req.originalUrl = '/api/admin/session';
  return runExpress(app, req, res);
}
