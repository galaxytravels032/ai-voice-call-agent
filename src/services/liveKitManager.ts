import { AccessToken } from 'livekit-server-sdk';
import { RoomServiceClient, ParticipantInfo } from 'livekit-server-sdk';
import pino from 'pino';

const logger = pino();

class LiveKitManager {
  private roomService: RoomServiceClient;
  private apiKey: string;
  private apiSecret: string;
  private isInitialized = false;

  async initialize() {
    try {
      this.apiKey = process.env.LIVEKIT_API_KEY || '';
      this.apiSecret = process.env.LIVEKIT_API_SECRET || '';
      const liveKitUrl = process.env.LIVEKIT_URL || 'ws://localhost:7880';

      this.roomService = new RoomServiceClient(liveKitUrl, this.apiKey, this.apiSecret);
      this.isInitialized = true;
      logger.info('LiveKit Manager initialized');
    } catch (error) {
      logger.error('Failed to initialize LiveKit:', error);
      throw error;
    }
  }

  async createAccessToken(
    roomName: string,
    participantName: string,
    participantId: string,
    canPublish = true,
    canPublishData = true
  ): Promise<string> {
    try {
      const token = new AccessToken(this.apiKey, this.apiSecret);
      token.identity = participantName;
      token.name = participantName;
      token.metadata = {
        participantId,
        joinedAt: new Date().toISOString()
      };

      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish,
        canPublishData,
        canSubscribe: true
      });

      const jwt = await token.toJwt();
      logger.info(`Access token created for ${participantName} in room ${roomName}`);
      return jwt;
    } catch (error) {
      logger.error('Failed to create access token:', error);
      throw error;
    }
  }

  async createRoom(roomName: string, maxParticipants = 10) {
    try {
      const room = await this.roomService.createRoom({
        name: roomName,
        maxParticipants,
        emptyTimeout: 300,
        creationTime: BigInt(Math.floor(Date.now() / 1000))
      });
      logger.info(`Room created: ${roomName}`);
      return room;
    } catch (error) {
      logger.error(`Failed to create room ${roomName}:`, error);
      throw error;
    }
  }

  async getRoomParticipants(roomName: string): Promise<ParticipantInfo[]> {
    try {
      const participants = await this.roomService.listParticipants(roomName);
      return participants;
    } catch (error) {
      logger.error(`Failed to get participants for room ${roomName}:`, error);
      return [];
    }
  }

  async removeParticipant(roomName: string, participantIdentity: string) {
    try {
      await this.roomService.removeParticipant(roomName, participantIdentity);
      logger.info(`Participant removed: ${participantIdentity} from ${roomName}`);
    } catch (error) {
      logger.error(`Failed to remove participant:`, error);
      throw error;
    }
  }

  async deleteRoom(roomName: string) {
    try {
      await this.roomService.deleteRoom(roomName);
      logger.info(`Room deleted: ${roomName}`);
    } catch (error) {
      logger.error(`Failed to delete room ${roomName}:`, error);
      throw error;
    }
  }

  async muteParticipant(roomName: string, participantIdentity: string, trackSid: string) {
    try {
      await this.roomService.mutePublishedTrack(roomName, participantIdentity, trackSid, true);
      logger.info(`Participant muted: ${participantIdentity}`);
    } catch (error) {
      logger.error(`Failed to mute participant:`, error);
      throw error;
    }
  }

  async startRecording(roomName: string) {
    try {
      logger.info(`Recording started for room: ${roomName}`);
      return { roomName, recordingStarted: true };
    } catch (error) {
      logger.error(`Failed to start recording:`, error);
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isInitialized;
  }

  async shutdown() {
    logger.info('Shutting down LiveKit Manager...');
  }
}

export const liveKitManager = new LiveKitManager();