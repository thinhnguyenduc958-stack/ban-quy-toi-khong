import { app } from '../server/app';
import { runExpress } from '../server/serverless';

export default function handler(req: any, res: any) {
  req.url = '/bank-settings';
  req.originalUrl = '/api/bank-settings';
  return runExpress(app, req, res);
}
