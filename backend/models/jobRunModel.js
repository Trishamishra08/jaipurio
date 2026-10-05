const mongoose = require('mongoose');

const jobRunSchema = new mongoose.Schema(
  {
    jobName: { type: String, required: true, index: true },
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    detail: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobRun', jobRunSchema);
