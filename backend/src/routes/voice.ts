import { Router } from 'express';
import { logger } from '../utils/logger.js';

export const voiceRouter = Router();

voiceRouter.post('/start', (req, res) => {
  const callId = req.body.callId || `call_${Date.now()}`;
  logger.info(`Voice call started: ${callId}`);

  res.json({
    success: true,
    callId,
    message: 'Voice call session initialized',
    wsUrl: 'ws://localhost:3001/ws/voice',
  });
});

voiceRouter.post('/end/:callId', (req, res) => {
  const { callId } = req.params;
  logger.info(`Voice call ended: ${callId}`);

  res.json({
    success: true,
    callId,
    message: 'Voice call session ended',
  });
});

voiceRouter.get('/status/:callId', (req, res) => {
  const { callId } = req.params;

  res.json({
    callId,
    status: 'active',
    timestamp: new Date().toISOString(),
  });
});
