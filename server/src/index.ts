import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import { router } from './routes';

let logger: pino.Logger;
try {
  logger = pino({
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  });
} catch {
  logger = pino();
}

const app = express();
const port = process.env.PORT || 3001;

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'request');
  next();
});

// CORS — only needed for API routes (static files are same-origin)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
});

// API routes — mounted under /api with CORS
app.use('/api', corsMiddleware, express.json(), router);

// Health check + debug info
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Resolve client dist path — try multiple strategies for different environments
function resolveClientDist(): string {
  const candidates = [
    path.join(__dirname, '../../client/dist'),        // from server/dist/ (compiled)
    path.join(__dirname, '../../../client/dist'),      // deeper nesting
    path.join(process.cwd(), 'client/dist'),           // cwd = project root
    path.join(process.cwd(), '../client/dist'),        // cwd = server/
  ];

  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(resolved) && fs.existsSync(path.join(resolved, 'index.html'))) {
      logger.info({ path: resolved }, 'Client dist found');
      return resolved;
    }
  }

  // Fallback to first candidate and log warning
  const fallback = path.resolve(candidates[0]);
  logger.warn({ path: fallback, cwd: process.cwd(), dirname: __dirname }, 'Client dist not found, using fallback');
  return fallback;
}

const clientDist = resolveClientDist();

// Serve client static files in production
app.use(express.static(clientDist));

// SPA catch-all — serve index.html for all non-API routes
app.get('*', (_req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Client not built. Run npm run build first.' });
  }
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
