import * as cron from 'node-cron';
import pino from 'pino';
import { CallLog } from '../models/CallLog';
import { CallMetrics } from '../models/CallMetrics';

const logger = pino();

class ScheduledTasks {
  private tasks: any[] = [];

  start() {
    this.tasks.push(
      cron.schedule('0 0 * * *', async () => {
        await this.cleanupOldLogs();
      })
    );

    this.tasks.push(
      cron.schedule('0 1 * * *', async () => {
        await this.calculateDailyMetrics();
      })
    );

    this.tasks.push(
      cron.schedule('0 * * * *', async () => {
        await this.updateCallCosts();
      })
    );

    this.tasks.push(
      cron.schedule('*/5 * * * *', async () => {
        await this.healthCheck();
      })
    );

    logger.info('✅ Scheduled tasks initialized');
  }

  private async cleanupOldLogs() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const result = await CallLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
      logger.info(`🗑️ Cleaned up ${result.deletedCount} old call logs`);
    } catch (error) {
      logger.error('Error cleaning up logs:', error);
    }
  }

  private async calculateDailyMetrics() {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
      const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

      const metrics = await CallLog.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfYesterday, $lte: endOfYesterday }
          }
        },
        {
          $group: {
            _id: '$userId',
            totalCalls: { $sum: 1 },
            avgDuration: { $avg: '$duration' },
            totalDuration: { $sum: '$duration' },
            successCount: { $sum: { $cond: ['$successFlag', 1, 0] } }
          }
        }
      ]);

      for (const metric of metrics) {
        await CallMetrics.create({
          userId: metric._id,
          duration: metric.totalDuration,
          resolutionRate: (metric.successCount / metric.totalCalls) * 100,
          costPerMinute: 0.10
        });
      }

      logger.info(`📊 Calculated daily metrics for ${metrics.length} users`);
    } catch (error) {
      logger.error('Error calculating daily metrics:', error);
    }
  }

  private async updateCallCosts() {
    try {
      const result = await CallMetrics.updateMany(
        { totalCost: 0 },
        [
          {
            $set: {
              totalCost: {
                $multiply: [{ $divide: ['$duration', 60] }, '$costPerMinute']
              }
            }
          }
        ]
      );

      logger.info(`💰 Updated costs for ${result.modifiedCount} metrics`);
    } catch (error) {
      logger.error('Error updating call costs:', error);
    }
  }

  private async healthCheck() {
    try {
      const recentCalls = await CallLog.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
      });

      logger.debug(`📱 Health check: ${recentCalls} calls in last 5 minutes`);
    } catch (error) {
      logger.error('Health check failed:', error);
    }
  }

  stop() {
    this.tasks.forEach(task => task.stop());
    logger.info('✅ Scheduled tasks stopped');
  }
}

export const scheduledTasks = new ScheduledTasks();