import Vapi from '@vapi-ai/server-sdk';
import pino from 'pino';
import { redisClient } from '../database/redisClient';
import { CallLog } from '../models/CallLog';
import { CallMetrics } from '../models/CallMetrics';

const logger = pino();

class VapiManager {
  private client: Vapi;
  private isInitialized = false;
  private activeCallsCache = new Map();

  async initialize() {
    try {
      this.client = new Vapi({
        apiToken: process.env.VAPI_API_KEY,
        serverUrl: process.env.VAPI_SERVER_URL
      });
      this.isInitialized = true;
      logger.info('Vapi Manager initialized');
    } catch (error) {
      logger.error('Failed to initialize Vapi:', error);
      throw error;
    }
  }

  async createPhoneCall(config: {
    phoneNumber: string;
    assistantId: string;
    language: string;
    callType: string;
    userId: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const callResponse = await this.client.calls.create({
        phoneNumber: {
          numberE164: config.phoneNumber
        },
        assistantId: config.assistantId,
        assistantOverrides: {
          transcriber: {
            language: config.language === 'es' ? 'es-ES' : config.language === 'fr' ? 'fr-FR' : 'en-US'
          },
          voice: {
            voiceId: this.getVoiceId(config.language)
          }
        },
        metadata: {
          userId: config.userId,
          callType: config.callType,
          language: config.language,
          ...config.metadata
        }
      });

      const callId = callResponse.id;
      this.activeCallsCache.set(callId, {
        ...config,
        startTime: Date.now(),
        status: 'initiated'
      });

      await redisClient.setex(`call:${callId}`, 86400, JSON.stringify({
        ...config,
        callId,
        status: 'active'
      }));

      await CallLog.create({
        callId,
        phoneNumber: config.phoneNumber,
        assistantId: config.assistantId,
        language: config.language,
        callType: config.callType,
        userId: config.userId,
        startTime: new Date(),
        status: 'initiated'
      });

      logger.info(`Call initiated: ${callId}`);
      return { callId, status: 'success' };
    } catch (error) {
      logger.error('Failed to create call:', error);
      throw error;
    }
  }

  async getCallStatus(callId: string) {
    try {
      const cachedCall = await redisClient.get(`call:${callId}`);
      if (cachedCall) {
        return JSON.parse(cachedCall);
      }

      const call = await this.client.calls.retrieve(callId);
      return {
        callId,
        status: call.status,
        duration: call.endedReason?.duration || 0,
        transcript: call.messages || [],
        recordingUrl: call.recordingUrl
      };
    } catch (error) {
      logger.error(`Failed to get call status for ${callId}:`, error);
      throw error;
    }
  }

  async endCall(callId: string) {
    try {
      await this.client.calls.delete(callId);
      this.activeCallsCache.delete(callId);
      await redisClient.del(`call:${callId}`);

      await CallLog.findOneAndUpdate(
        { callId },
        { status: 'ended', endTime: new Date() }
      );

      logger.info(`Call ended: ${callId}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to end call ${callId}:`, error);
      throw error;
    }
  }

  async getCallTranscript(callId: string) {
    try {
      const call = await this.client.calls.retrieve(callId);
      const messages = call.messages || [];

      const transcript = messages
        .map((msg: any) => ({
          speaker: msg.role === 'user' ? 'customer' : 'agent',
          text: msg.content,
          timestamp: msg.createdAt
        }));

      return transcript;
    } catch (error) {
      logger.error(`Failed to get transcript for ${callId}:`, error);
      throw error;
    }
  }

  async recordMetrics(callId: string) {
    try {
      const callLog = await CallLog.findOne({ callId });
      if (!callLog) return;

      const duration = Math.floor((callLog.endTime?.getTime() || Date.now() - callLog.startTime.getTime()) / 1000);
      const transcript = await this.getCallTranscript(callId);

      const metrics = {
        callId,
        userId: callLog.userId,
        duration,
        callType: callLog.callType,
        language: callLog.language,
        transcriptLength: transcript.length,
        status: callLog.status,
        timestamp: new Date()
      };

      await CallMetrics.create(metrics);
      return metrics;
    } catch (error) {
      logger.error(`Failed to record metrics for ${callId}:`, error);
    }
  }

  private getVoiceId(language: string): string {
    const voiceMap: Record<string, string> = {
      'en': 'en-US-Neural2-C',
      'es': 'es-ES-Neural2-A',
      'fr': 'fr-FR-Neural2-A',
      'de': 'de-DE-Neural2-B',
      'it': 'it-IT-Neural2-A',
      'pt': 'pt-BR-Neural2-A',
      'ja': 'ja-JP-Neural2-B',
      'zh': 'zh-CN-Neural3-A',
      'ar': 'ar-XA-Neural2-A',
      'hi': 'hi-IN-Neural2-A'
    };
    return voiceMap[language] || 'en-US-Neural2-C';
  }

  isHealthy(): boolean {
    return this.isInitialized;
  }

  async shutdown() {
    logger.info('Shutting down Vapi Manager...');
    for (const [callId] of this.activeCallsCache) {
      await this.endCall(callId);
    }
  }
}

export const vapiManager = new VapiManager();