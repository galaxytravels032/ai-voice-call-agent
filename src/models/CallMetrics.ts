import mongoose from 'mongoose';

const CallMetricsSchema = new mongoose.Schema({
  callId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  duration: { type: Number, required: true },
  callType: { type: String },
  language: { type: String },
  transcriptLength: { type: Number, default: 0 },
  status: { type: String },
  averageResponseTime: { type: Number, default: 0 },
  customerSentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
  resolutionRate: { type: Number, default: 0 },
  nps: { type: Number, min: 0, max: 10 },
  costPerMinute: { type: Number, default: 0.10 },
  totalCost: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, index: true }
});

CallMetricsSchema.pre('save', function(next) {
  if (this.duration) {
    this.totalCost = (this.duration / 60) * this.costPerMinute;
  }
  next();
});

CallMetricsSchema.index({ userId: 1, createdAt: -1 });
CallMetricsSchema.index({ callType: 1, createdAt: -1 });

export const CallMetrics = mongoose.model('CallMetrics', CallMetricsSchema);