import mongoose from 'mongoose';
import pino from 'pino';

const logger = pino();

class MongoConnection {
  private isConnected = false;

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-call-center';
      
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      this.isConnected = true;
      logger.info('✅ MongoDB connected successfully');
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('✅ MongoDB disconnected');
    } catch (error) {
      logger.error('❌ MongoDB disconnection failed:', error);
    }
  }

  isConnected(): boolean {
    return this.isConnected;
  }
}

export const mongoConnection = new MongoConnection();