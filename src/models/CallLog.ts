import mongoose from 'mongoose';

const CallLogSchema = new mongoose.Schema({
  callId: { type: String, required: true, unique: true, index: true },
  phoneNumber: { type: String, required: true },
  assistantId: { type: String, required: true },
  language: { type: String, default: 'en' },
  callType: { type: String, enum: ['support', 'sales', 'survey', 'callback', 'custom'] },
  userId: { type: String, required: true, index: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number, default: 0 },
  status: { type: String, enum: ['initiated', 'ringing', 'active', 'ended', 'failed'], default: 'initiated' },
  transcript: { type: [Object], default: [] },
  recordingUrl: { type: String },
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
  successFlag: { type: Boolean, default: false },
  cost: { type: Number, default: 0 },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
});

CallLogSchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
  }
  next();
});

CallLogSchema.index({ userId: 1, createdAt: -1 });
CallLogSchema.index({ callType: 1, status: 1 });

export const CallLog = mongoose.model('CallLog', CallLogSchema);