import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { app } from './server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Serve public directory and static images statically
const publicDir = path.resolve(__dirname, 'public');
const uploadsDir = path.resolve(publicDir, 'uploads');
const srcAssetsDir = path.resolve(__dirname, 'src/assets');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (_) {
  // Read-only filesystem in serverless/container environment - ignore safely
}

app.use(express.static(publicDir));
app.use('/uploads', express.static(uploadsDir));
app.use('/images', express.static(path.resolve(publicDir, 'images')));
app.use('/assets', express.static(path.resolve(publicDir, 'assets')));
app.use('/src/assets', express.static(srcAssetsDir));

async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 [BẠN QUÝ TÔI KHÔNG?] Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  startServer();
}

export default app;
