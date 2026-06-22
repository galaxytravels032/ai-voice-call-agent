import express, { Router } from 'express';
import { CallLog } from '../models/CallLog';
import { CallMetrics } from '../models/CallMetrics';
import pino from 'pino';

const logger = pino();

export const analyticsRouter: Router = express.Router();

analyticsRouter.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;

    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const totalCalls = await CallLog.countDocuments({
      userId,
      createdAt: { $gte: startDate }
    });

    const callsByType = await CallLog.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$callType', count: { $sum: 1 } } }
    ]);

    const avgDuration = await CallLog.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]);

    const successCalls = await CallLog.countDocuments({
      userId,
      createdAt: { $gte: startDate },
      successFlag: true
    });

    const callsByLanguage = await CallLog.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$language', count: { $sum: 1 } } }
    ]);

    const sentimentBreakdown = await CallLog.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      { $group: { _id: '$sentiment', count: { $sum: 1 } } }
    ]);

    const metrics = await CallMetrics.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      { $group: { _id: null, totalCost: { $sum: '$totalCost' } } }
    ]);

    res.json({
      userId,
      period: { days: Number(days), startDate },
      summary: {
        totalCalls,
        successRate: totalCalls > 0 ? ((successCalls / totalCalls) * 100).toFixed(2) : 0,
        avgDuration: avgDuration[0]?.avgDuration?.toFixed(2) || 0,
        totalCost: metrics[0]?.totalCost?.toFixed(2) || 0
      },
      breakdown: {
        byType: callsByType,
        byLanguage: callsByLanguage,
        bySentiment: sentimentBreakdown
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

analyticsRouter.get('/performance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);

    const metrics = await CallMetrics.find({
      userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    const performanceByDay = await CallMetrics.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          avgDuration: { $avg: '$duration' },
          avgResolution: { $avg: '$resolutionRate' },
          totalCost: { $sum: '$totalCost' },
          count: { $sum: 1 },
          avgNPS: { $avg: '$nps' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      userId,
      period: { days: Number(days), startDate },
      totalMetrics: metrics.length,
      performanceByDay,
      averages: {
        duration: (metrics.reduce((a, m) => a + m.duration, 0) / metrics.length).toFixed(2),
        resolutionRate: (metrics.reduce((a, m) => a + m.resolutionRate, 0) / metrics.length).toFixed(2),
        nps: (metrics.reduce((a, m) => a + (m.nps || 0), 0) / metrics.length).toFixed(2)
      }
    });
  } catch (error) {
    logger.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
});

analyticsRouter.get('/languages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const languageStats = await CallLog.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$language',
          totalCalls: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          successRate: {
            $avg: { $cond: [{ $eq: ['$successFlag', true] }, 1, 0] }
          }
        }
      },
      { $sort: { totalCalls: -1 } }
    ]);

    res.json({
      userId,
      languages: languageStats.map(lang => ({
        language: lang._id,
        totalCalls: lang.totalCalls,
        avgDuration: lang.avgDuration.toFixed(2),
        successRate: (lang.successRate * 100).toFixed(2)
      }))
    });
  } catch (error) {
    logger.error('Error fetching language analytics:', error);
    res.status(500).json({ error: 'Failed to fetch language analytics' });
  }
});

analyticsRouter.get('/export/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { format = 'json' } = req.query;

    const calls = await CallLog.find({ userId }).sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvHeader = ['Call ID', 'Phone Number', 'Language', 'Call Type', 'Duration', 'Status', 'Date'].join(',');
      const csvRows = calls.map(call =>
        [call.callId, call.phoneNumber, call.language, call.callType, call.duration, call.status, call.createdAt].join(',')
      );
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=calls.csv');
      res.send([csvHeader, ...csvRows].join('\n'));
    } else {
      res.json({
        userId,
        totalRecords: calls.length,
        data: calls
      });
    }
  } catch (error) {
    logger.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});