/**
 * Serverless execution helper for Vercel and Node.js serverless functions.
 * Resolves seamlessly when res.end(), res.json(), res.send(), or res.finish is called.
 */
export function runExpress(app: any, req: any, res: any): Promise<void> {
  // If @vercel/node pre-parsed the body, mark it so body-parser doesn't hang
  if (req.body !== undefined && req.body !== null) {
    (req as any)._body = true;
  }

  return new Promise<void>((resolve, reject) => {
    let resolved = false;
    const done = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };

    if (typeof res.on === 'function') {
      res.on('finish', done);
      res.on('close', done);
      res.on('error', (err: any) => {
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });
    }

    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      const ret = originalEnd ? originalEnd.apply(this, args) : undefined;
      done();
      return ret;
    };

    const originalJson = res.json;
    if (typeof originalJson === 'function') {
      res.json = function (...args: any[]) {
        const ret = originalJson.apply(this, args);
        done();
        return ret;
      };
    }

    const originalSend = res.send;
    if (typeof originalSend === 'function') {
      res.send = function (...args: any[]) {
        const ret = originalSend.apply(this, args);
        done();
        return ret;
      };
    }

    app(req, res, (err: any) => {
      if (err) {
        if (!res.headersSent && typeof res.status === 'function') {
          res.status(500).json({
            success: false,
            message: 'Máy chủ đang gặp sự cố. Vui lòng thử lại.',
            details: err?.message || String(err),
          });
        }
      }
      done();
    });
  });
}
