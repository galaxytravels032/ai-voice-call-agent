import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import pino from 'pino';
import pinoHttp from 'pino-http';

// Import modules
import { vapiManager } from './services/vapiManager';
import { liveKitManager } from './services/liveKitManager';
import { callRouter } from './routes/callRoutes';
import { analyticsRouter } from './routes/analyticsRoutes';
import { mongoConnection } from './database/mongoConnection';
import { redisClient } from './database/redisClient';
import { monitoringServer } from './monitoring/monitoringServer';
import { scheduledTasks } from './jobs/scheduledTasks';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET', 'POST'] }
});

const logger = pino();
const httpLogger = pinoHttp({ logger });

// Middleware
app.use(httpLogger);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '3.5.0',
    services: {
      vapi: vapiManager.isHealthy(),
      liveKit: liveKitManager.isHealthy(),
      mongodb: mongoConnection.isConnected(),
      redis: redisClient.isConnected()
    }
  });
});

// Routes
app.use('/api/v1/calls', callRouter(io));
app.use('/api/v1/analytics', analyticsRouter);

// WebSocket events for real-time monitoring
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe-call', (callId: string) => {
    socket.join(`call-${callId}`);
    logger.info(`Subscribed to call: ${callId}`);
  });

  socket.on('subscribe-dashboard', (userId: string) => {
    socket.join(`dashboard-${userId}`);
    logger.info(`User subscribed to dashboard: ${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Initialize services
async function initialize() {
  try {
    logger.info('🚀 Starting AI Call Center Sonic 3.5...');

    // Connect to databases
    await mongoConnection.connect();
    logger.info('✅ MongoDB connected');

    await redisClient.connect();
    logger.info('✅ Redis connected');

    // Initialize Vapi
    await vapiManager.initialize();
    logger.info('✅ Vapi initialized');

    // Initialize LiveKit
    await liveKitManager.initialize();
    logger.info('✅ LiveKit initialized');

    // Start scheduled jobs
    scheduledTasks.start();
    logger.info('✅ Scheduled tasks started');

    // Start monitoring
    monitoringServer.start(io);
    logger.info('✅ Monitoring server started');

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`🎯 Server running on port ${PORT}`);
      logger.info(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
      logger.info(`📡 WebSocket: ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Initialization failed:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('🛑 Shutting down gracefully...');
  await vapiManager.shutdown();
  await liveKitManager.shutdown();
  await mongoConnection.disconnect();
  await redisClient.disconnect();
  server.close(() => {
    logger.info('✅ Server closed');
    process.exit(0);
  });
});

initialize();

export { app, server, io };