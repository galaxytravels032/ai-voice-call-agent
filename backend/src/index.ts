import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { voiceRouter } from './routes/voice.js';
import { healthRouter } from './routes/health.js';
import { WebSocketHandler } from './websocket/handler.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/health', healthRouter);
app.use('/api/voice', voiceRouter);

// HTTP Server
const server = createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server });
const wsHandler = new WebSocketHandler(wss);

wss.on('connection', (ws) => {
  logger.info('New WebSocket connection');
  wsHandler.handleConnection(ws);
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
server.listen(port, () => {
  logger.info(`🚀 Server running on port ${port}`);
  logger.info(`📡 WebSocket server ready at ws://localhost:${port}/ws/voice`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
