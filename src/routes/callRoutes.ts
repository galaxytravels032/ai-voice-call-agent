import express, { Router } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { vapiManager } from '../services/vapiManager';
import { liveKitManager } from '../services/liveKitManager';
import { CallLog } from '../models/CallLog';
import pino from 'pino';

const logger = pino();

export function callRouter(io: SocketIOServer): Router {
  const router = express.Router();

  router.post('/initiate', async (req, res) => {
    try {
      const { phoneNumber, language = 'en', callType = 'support', userId, assistantId, metadata } = req.body;

      if (!phoneNumber || !userId || !assistantId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await vapiManager.createPhoneCall({
        phoneNumber,
        assistantId,
        language,
        callType,
        userId,
        metadata
      });

      io.to(`dashboard-${userId}`).emit('call-initiated', {
        callId: result.callId,
        phoneNumber,
        language,
        callType
      });

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Error initiating call:', error);
      res.status(500).json({ error: 'Failed to initiate call' });
    }
  });

  router.get('/:callId/status', async (req, res) => {
    try {
      const { callId } = req.params;
      const status = await vapiManager.getCallStatus(callId);
      res.json(status);
    } catch (error) {
      logger.error('Error getting call status:', error);
      res.status(500).json({ error: 'Failed to get call status' });
    }
  });

  router.get('/:callId/transcript', async (req, res) => {
    try {
      const { callId } = req.params;
      const transcript = await vapiManager.getCallTranscript(callId);
      res.json({ callId, transcript });
    } catch (error) {
      logger.error('Error getting transcript:', error);
      res.status(500).json({ error: 'Failed to get transcript' });
    }
  });

  router.post('/:callId/end', async (req, res) => {
    try {
      const { callId } = req.params;
      const result = await vapiManager.endCall(callId);
      
      await vapiManager.recordMetrics(callId);

      io.emit('call-ended', { callId });

      res.json({ success: true, ...result });
    } catch (error) {
      logger.error('Error ending call:', error);
      res.status(500).json({ error: 'Failed to end call' });
    }
  });

  router.get('/history/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      const calls = await CallLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(offset));

      const total = await CallLog.countDocuments({ userId });

      res.json({
        userId,
        total,
        limit: Number(limit),
        offset: Number(offset),
        calls
      });
    } catch (error) {
      logger.error('Error fetching call history:', error);
      res.status(500).json({ error: 'Failed to fetch call history' });
    }
  });

  router.post('/batch/initiate', async (req, res) => {
    try {
      const { calls } = req.body;

      if (!Array.isArray(calls) || calls.length === 0) {
        return res.status(400).json({ error: 'Invalid calls array' });
      }

      const results = [];
      for (const callConfig of calls) {
        try {
          const result = await vapiManager.createPhoneCall(callConfig);
          results.push({ success: true, ...result });
        } catch (error) {
          results.push({ success: false, error: String(error), phoneNumber: callConfig.phoneNumber });
        }
      }

      res.json({ totalRequested: calls.length, results });
    } catch (error) {
      logger.error('Error batch initiating calls:', error);
      res.status(500).json({ error: 'Failed to batch initiate calls' });
    }
  });

  router.post('/live-listen/:callId', async (req, res) => {
    try {
      const { callId } = req.params;
      const { supervisorId } = req.body;

      const roomName = `call-${callId}-room`;
      
      await liveKitManager.createRoom(roomName, 5);

      const token = await liveKitManager.createAccessToken(
        roomName,
        `supervisor-${supervisorId}`,
        supervisorId,
        false,
        true
      );

      res.json({
        callId,
        roomName,
        token,
        liveKitUrl: process.env.LIVEKIT_URL
      });
    } catch (error) {
      logger.error('Error getting live listen token:', error);
      res.status(500).json({ error: 'Failed to get live listen access' });
    }
  });

  router.get('/:callId/participants', async (req, res) => {
    try {
      const { callId } = req.params;
      const roomName = `call-${callId}-room`;
      const participants = await liveKitManager.getRoomParticipants(roomName);
      res.json({ callId, participants });
    } catch (error) {
      logger.error('Error getting participants:', error);
      res.status(500).json({ error: 'Failed to get participants' });
    }
  });

  return router;
}