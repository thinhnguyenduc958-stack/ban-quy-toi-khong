import { app } from '../server/app';
import { runExpress } from '../server/serverless';

export default function handler(req: any, res: any) {
  req.url = '/leaderboard';
  req.originalUrl = '/api/leaderboard';
  return runExpress(app, req, res);
}
