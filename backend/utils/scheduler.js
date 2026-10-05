/**
 * Real cron scheduler — registers the two jobs the admin System page's
 * Cronjob card has always claimed were running ("Orders & Incomplete Cart
 * Cleanup" every 6h, "Vendor Payout Reconciliation" daily), logging each
 * run to JobRun so the admin UI can show real history instead of a static
 * "Running" label.
 */
const cron = require('node-cron');
const JobRun = require('../models/jobRunModel');
const Order = require('../models/orderModel');
const { runCleanupLogic } = require('../controllers/adminController');
const { releaseAvailableIfReady } = require('../controllers/orderFlowController');

const runJob = async (jobName, fn) => {
  const startedAt = new Date();
  try {
    const detail = await fn();
    await JobRun.create({ jobName, startedAt, finishedAt: new Date(), status: 'success', detail: detail || '' });
  } catch (error) {
    await JobRun.create({ jobName, startedAt, finishedAt: new Date(), status: 'failed', detail: error.message });
  }
};

const JOBS = [
  {
    name: 'Orders & Incomplete Cart Cleanup',
    schedule: '0 */6 * * *', // every 6 hours
    run: () => runJob('Orders & Incomplete Cart Cleanup', runCleanupLogic),
  },
  {
    name: 'Vendor Payout Reconciliation',
    schedule: '0 0 * * *', // daily at 00:00
    run: () =>
      runJob('Vendor Payout Reconciliation', async () => {
        const completedOrders = await Order.find({ orderStatus: 'Completed' })
          .select('_id orderStatus returnWindowClosesAt completedAt updatedAt');
        for (const order of completedOrders) {
          await releaseAvailableIfReady(order);
        }
        return `Checked ${completedOrders.length} completed order(s) for earnings release.`;
      }),
  },
];

let started = false;

const startScheduler = () => {
  if (started) return; // avoid double-registering on a hot reload
  started = true;
  JOBS.forEach((job) => {
    cron.schedule(job.schedule, job.run);
  });
  console.log(`Scheduler started: ${JOBS.map((j) => j.name).join(', ')}`);
};

module.exports = { startScheduler, JOBS };
