const ScheduledMessage = require("../models/ScheduledMessage");

let intervalId = null;
let isRunning = false;

// Finds due messages, logs them as delivered, and marks their status.
async function processScheduledMessages() {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date();

    const messages = await ScheduledMessage.find({
      status: "scheduled",
      scheduledAt: { $lte: now }
    })
      .sort({ scheduledAt: 1 })
      .limit(100);

    for (const item of messages) {
      try {
        console.log(
          `[SCHEDULED MESSAGE] ${item.scheduledAt.toISOString()} -> ${item.message}`
        );

        await ScheduledMessage.updateOne(
          { _id: item._id, status: "scheduled" },
          {
            $set: {
              status: "processed",
              processedAt: new Date()
            }
          }
        );
      } catch (error) {
        await ScheduledMessage.updateOne(
          { _id: item._id },
          {
            $set: {
              status: "failed",
              error: error.message
            }
          }
        );
      }
    }
  } catch (error) {
    console.error("Scheduler error:", error.message);
  } finally {
    isRunning = false;
  }
}

// Starts the recurring scheduler loop and performs an immediate first check.
function startScheduler() {
  const interval = Number(process.env.SCHEDULER_INTERVAL_MS || 1000);

  processScheduledMessages();
  intervalId = setInterval(processScheduledMessages, interval);

  console.log(`Scheduler started. Interval: ${interval}ms`);
}

// Stops the recurring scheduler loop during graceful shutdown.
function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

module.exports = {
  startScheduler,
  stopScheduler
};
