const {
  runReminderNotificationCheck,
} = require("./reminderNotificationJob");
const {
  processPendingNotificationDeliveries,
} = require("../services/notificationDeliveryService");

const SCHEDULER_INTERVAL_MS = 60 * 1000;

let isRunning = false;
let intervalId = null;

async function runSchedulerCycle() {
  if (isRunning) {
    console.info("[NotificationScheduler] Previous cycle is still running; skipping this cycle.");
    return;
  }

  isRunning = true;

  try {
    try {
      const planningSummary = await runReminderNotificationCheck();
      console.info("[NotificationScheduler] Reminder planning summary:", planningSummary);
    } catch (error) {
      console.error(
        "[NotificationScheduler] Reminder planning failed:",
        error.code || error.name || "unknown error"
      );
    }

    try {
      const deliverySummary = await processPendingNotificationDeliveries();
      console.info("[NotificationScheduler] Delivery processing summary:", deliverySummary);
    } catch (error) {
      console.error(
        "[NotificationScheduler] Delivery processing failed:",
        error.code || error.name || "unknown error"
      );
    }
  } finally {
    isRunning = false;
  }
}

function startNotificationScheduler() {
  if (intervalId !== null) {
    return intervalId;
  }

  void runSchedulerCycle();
  intervalId = setInterval(() => {
    void runSchedulerCycle();
  }, SCHEDULER_INTERVAL_MS);

  return intervalId;
}

module.exports = { startNotificationScheduler };
