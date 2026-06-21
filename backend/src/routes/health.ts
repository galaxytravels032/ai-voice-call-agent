import { Router } from 'express';
import { logger } from '../utils/logger.js';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  logger.info('Health check');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

healthRouter.post('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});
