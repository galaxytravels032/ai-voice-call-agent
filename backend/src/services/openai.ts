import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export class OpenAIService {
  /**
   * Transcribe audio buffer to text using Whisper
   */
  static async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
      logger.debug('Transcribing audio with Whisper');
      
      const response = await openai.audio.transcriptions.create({
        file: new File([audioBuffer], 'audio.wav', { type: 'audio/wav' }),
        model: 'whisper-1',
        language: 'en',
      });

      logger.debug(`Transcription: ${response.text}`);
      return response.text;
    } catch (error) {
      logger.error('Transcription error:', error);
      throw error;
    }
  }

  /**
   * Get AI response using GPT-4
   */
  static async getAIResponse(messages: OpenAI.Chat.ChatCompletionMessageParam[]): Promise<string> {
    try {
      logger.debug('Getting AI response from GPT-4');
      
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      logger.debug(`AI Response: ${content}`);
      return content;
    } catch (error) {
      logger.error('OpenAI error:', error);
      throw error;
    }
  }

  /**
   * Start a streaming conversation
   */
  static async streamAIResponse(messages: OpenAI.Chat.ChatCompletionMessageParam[]) {
    try {
      logger.debug('Starting streaming response');
      
      return await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 500,
        stream: true,
      });
    } catch (error) {
      logger.error('Streaming error:', error);
      throw error;
    }
  }
}
