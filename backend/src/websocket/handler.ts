import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { OpenAIService } from '../services/openai.js';
import { TextToSpeechService } from '../services/tts.js';

interface VoiceMessage {
  type: 'audio' | 'text' | 'start' | 'end' | 'error';
  data?: string | Buffer;
  id?: string;
  callId?: string;
}

interface CallSession {
  id: string;
  startTime: number;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  isActive: boolean;
}

export class WebSocketHandler {
  private wss: WebSocketServer;
  private sessions: Map<string, CallSession> = new Map();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
  }

  handleConnection(ws: WebSocket): void {
    const sessionId = uuidv4();
    logger.info(`New connection: ${sessionId}`);

    const session: CallSession = {
      id: sessionId,
      startTime: Date.now(),
      messages: [],
      isActive: false,
    };

    this.sessions.set(sessionId, session);

    // Send welcome message
    this.sendMessage(ws, {
      type: 'start',
      id: sessionId,
      data: 'Voice agent ready. Start speaking or send text.',
    });

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        await this.handleMessage(ws, sessionId, data);
      } catch (error) {
        logger.error('Message handling error:', error);
        this.sendMessage(ws, {
          type: 'error',
          data: 'Error processing message',
        });
      }
    });

    // Handle close
    ws.on('close', () => {
      logger.info(`Connection closed: ${sessionId}`);
      this.sessions.delete(sessionId);
    });

    // Handle error
    ws.on('error', (error) => {
      logger.error(`WebSocket error (${sessionId}):`, error);
    });
  }

  private async handleMessage(ws: WebSocket, sessionId: string, data: any): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.warn(`Session not found: ${sessionId}`);
      return;
    }

    try {
      // Parse incoming message
      const message = JSON.parse(data.toString());

      logger.debug(`Message from ${sessionId}:`, message.type);

      switch (message.type) {
        case 'audio':
          await this.handleAudio(ws, session, message.data);
          break;

        case 'text':
          await this.handleText(ws, session, message.data);
          break;

        case 'start':
          session.isActive = true;
          this.sendMessage(ws, {
            type: 'text',
            data: 'Call started. How can I help you today?',
          });
          break;

        case 'end':
          await this.handleEndCall(ws, session);
          break;

        default:
          logger.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      logger.error('Message parse error:', error);
    }
  }

  private async handleAudio(ws: WebSocket, session: CallSession, audioData: string): Promise<void> {
    try {
      // Decode base64 audio
      const audioBuffer = Buffer.from(audioData, 'base64');
      logger.debug(`Received audio: ${audioBuffer.length} bytes`);

      // Transcribe audio
      const transcription = await OpenAIService.transcribeAudio(audioBuffer);
      logger.info(`Transcribed: "${transcription}"`);

      // Add to conversation
      session.messages.push({
        role: 'user',
        content: transcription,
      });

      // Get AI response
      const aiResponse = await OpenAIService.getAIResponse(session.messages);

      // Add AI response to conversation
      session.messages.push({
        role: 'assistant',
        content: aiResponse,
      });

      // Send text response
      this.sendMessage(ws, {
        type: 'text',
        data: aiResponse,
      });

      // Generate and send audio response
      try {
        const audioResponse = await TextToSpeechService.textToSpeech(aiResponse);
        this.sendMessage(ws, {
          type: 'audio',
          data: audioResponse.toString('base64'),
        });
      } catch (error) {
        logger.warn('TTS failed, continuing with text only:', error);
      }
    } catch (error) {
      logger.error('Audio handling error:', error);
      this.sendMessage(ws, {
        type: 'error',
        data: 'Failed to process audio',
      });
    }
  }

  private async handleText(ws: WebSocket, session: CallSession, text: string): Promise<void> {
    try {
      logger.info(`Received text: "${text}"`);

      // Add to conversation
      session.messages.push({
        role: 'user',
        content: text,
      });

      // Get AI response
      const aiResponse = await OpenAIService.getAIResponse(session.messages);

      // Add AI response to conversation
      session.messages.push({
        role: 'assistant',
        content: aiResponse,
      });

      // Send response
      this.sendMessage(ws, {
        type: 'text',
        data: aiResponse,
      });

      // Generate and send audio response
      try {
        const audioResponse = await TextToSpeechService.textToSpeech(aiResponse);
        this.sendMessage(ws, {
          type: 'audio',
          data: audioResponse.toString('base64'),
        });
      } catch (error) {
        logger.warn('TTS failed, continuing with text only:', error);
      }
    } catch (error) {
      logger.error('Text handling error:', error);
      this.sendMessage(ws, {
        type: 'error',
        data: 'Failed to process text',
      });
    }
  }

  private async handleEndCall(ws: WebSocket, session: CallSession): Promise<void> {
    const duration = (Date.now() - session.startTime) / 1000;
    logger.info(`Call ended. Duration: ${duration}s, Messages: ${session.messages.length}`);

    this.sendMessage(ws, {
      type: 'end',
      data: `Call ended. Duration: ${duration.toFixed(1)}s`,
    });

    session.isActive = false;
  }

  private sendMessage(ws: WebSocket, message: VoiceMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}
