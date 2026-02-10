import express from 'express';
import cors from 'cors';
import path from 'path';
import pino from 'pino';
import { router } from './routes';

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

const app = express();
const port = process.env.PORT || 3001;

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'request');
  next();
});

// API routes — mounted under /api so the client can reach them via /api/*
app.use('/api', router);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Serve client static files in production
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// SPA catch-all — serve index.html for all non-API routes
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});
