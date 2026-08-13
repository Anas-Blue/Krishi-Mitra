/**
 * Scheduler — runs field checks daily at 6am IST for all active fields.
 */
const cron = require('node-cron');
const Field = require('../models/Field');
const { runFieldCheck } = require('./fieldCheckService');

function startScheduler() {
  // '0 6 * * *' = every day at 06:00 IST (UTC+5:30 = 00:30 UTC)
  cron.schedule('30 0 * * *', async () => {
    console.log('[scheduler] Daily field check started');
    try {
      const activeFields = await Field.find({ status: 'active' }).select('_id');
      let success = 0, failed = 0;
      for (const field of activeFields) {
        try {
          await runFieldCheck(field._id);
          success++;
        } catch (err) {
          console.error(`[scheduler] Field ${field._id} failed:`, err.message);
          failed++;
        }
      }
      console.log(`[scheduler] Done: ${success} succeeded, ${failed} failed`);
    } catch (err) {
      console.error('[scheduler] Fatal error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[scheduler] Daily field check cron registered (06:00 IST)');
}

module.exports = { startScheduler };
