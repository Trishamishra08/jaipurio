const express = require('express');
const { protect, authorize } = require('../middlewares/authMiddleware');
const JobRun = require('../models/jobRunModel');
const { JOBS } = require('../utils/scheduler');

const router = express.Router();

router.get('/runs', protect, authorize('admin'), async (req, res) => {
  try {
    const recent = await JobRun.find({}).sort({ startedAt: -1 }).limit(50).lean();
    const jobs = JOBS.map((job) => {
      const lastRun = recent.find((r) => r.jobName === job.name);
      return { name: job.name, schedule: job.schedule, lastRun: lastRun || null };
    });
    res.json({ success: true, data: { jobs, recent } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
