import { Server as SocketIOServer } from 'socket.io';
import pino from 'pino';
import { CallLog } from '../models/CallLog';
import { CallMetrics } from '../models/CallMetrics';

const logger = pino();

class MonitoringServer {
  private io: SocketIOServer | null = null;
  private updateInterval: any = null;

  start(io: SocketIOServer) {
    this.io = io;

    this.updateInterval = setInterval(async () => {
      await this.broadcastLiveStats();
    }, 2000);

    logger.info('📊 Monitoring server started');
  }

  private async broadcastLiveStats() {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      const activeCalls = await CallLog.countDocuments({
        status: { $in: ['ringing', 'active'] },
        createdAt: { $gte: fiveMinutesAgo }
      });

      const recentCalls = await CallLog.find({
        createdAt: { $gte: fiveMinutesAgo }
      }).sort({ createdAt: -1 }).limit(10);

      const metrics = await CallMetrics.aggregate([
        { $match: { createdAt: { $gte: fiveMinutesAgo } } },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' },
            totalCost: { $sum: '$totalCost' },
            avgResolution: { $avg: '$resolutionRate' }
          }
        }
      ]);

      if (this.io) {
        this.io.emit('live-stats', {
          timestamp: new Date().toISOString(),
          activeCalls,
          recentCalls,
          metrics: metrics[0] || {
            avgDuration: 0,
            totalCost: 0,
            avgResolution: 0
          }
        });
      }
    } catch (error) {
      logger.error('Error broadcasting stats:', error);
    }
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    logger.info('📊 Monitoring server stopped');
  }
}

export const monitoringServer = new MonitoringServer();