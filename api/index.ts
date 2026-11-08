import { app } from '../server/app';
import { runExpress } from '../server/serverless';

export default function handler(req: any, res: any) {
  return runExpress(app, req, res);
}
