import { logger } from '../utils/logger.js';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

export class TextToSpeechService {
  /**
   * Convert text to speech using Elevenlabs
   */
  static async textToSpeech(text: string): Promise<Buffer> {
    if (!ELEVENLABS_API_KEY) {
      logger.warn('Elevenlabs API key not set, returning empty buffer');
      return Buffer.alloc(0);
    }

    try {
      logger.debug(`Converting text to speech: "${text.substring(0, 50)}..."`);

      const response = await fetch(`${ELEVENLABS_API_URL}/${ELEVENLABS_VOICE_ID}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Elevenlabs error: ${response.statusText}`);
      }

      const audioBuffer = await response.arrayBuffer();
      logger.debug(`Audio generated: ${audioBuffer.byteLength} bytes`);

      return Buffer.from(audioBuffer);
    } catch (error) {
      logger.error('Text-to-speech error:', error);
      throw error;
    }
  }

  /**
   * Stream text-to-speech response
   */
  static async *streamTextToSpeech(text: string): AsyncGenerator<Buffer> {
    try {
      const audioBuffer = await this.textToSpeech(text);
      
      // Stream in 4KB chunks
      const chunkSize = 4096;
      for (let i = 0; i < audioBuffer.length; i += chunkSize) {
        yield audioBuffer.slice(i, i + chunkSize);
      }
    } catch (error) {
      logger.error('Stream TTS error:', error);
      throw error;
    }
  }
}
