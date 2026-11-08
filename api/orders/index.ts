import { app } from '../../server/app';
import { runExpress } from '../../server/serverless';

export default function handler(req: any, res: any) {
  req.url = '/orders';
  req.originalUrl = '/api/orders';
  return runExpress(app, req, res);
}
