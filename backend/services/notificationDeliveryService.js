const Reminder = require("../models/Reminder");
const PushRegistration = require("../models/PushRegistration");
const NotificationDelivery = require("../models/NotificationDelivery");
const { initializeFirebaseAdmin } = require("../config/firebaseAdmin");

const MAX_BATCH_SIZE = 20;
const MAX_ATTEMPTS = 5;
const CLAIM_TIMEOUT_MS = 5 * 60 * 1000;
const RETRY_DELAYS_MS = {
  1: 60 * 1000,
  2: 5 * 60 * 1000,
  3: 15 * 60 * 1000,
  4: 30 * 60 * 1000,
};
const TERMINAL_ERROR_CODES = [
  "reminder_missing",
  "reminder_completed",
  "due_date_changed",
  "registration_missing",
  "ownership_mismatch",
  "invalid_alert_type",
  "invalid_registration_timezone",
  "alert_no_longer_current",
  "max_attempts_exceeded",
];

function getDueDateKey(dueDate) {
  const parsedDate = dueDate instanceof Date ? dueDate : new Date(dueDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString().slice(0, 10);
}

function getLocalDateKey(date, timezone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const dateParts = Object.fromEntries(
    parts
      .filter((part) => ["year", "month", "day"].includes(part.type))
      .map((part) => [part.type, part.value])
  );

  if (!dateParts.year || !dateParts.month || !dateParts.day) {
    throw new Error("Unable to determine local calendar date");
  }

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function getTomorrowDateKey(dateKey) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateKey
  ) {
    return null;
  }

  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getSafeErrorCode(error) {
  const code = error && typeof error.code === "string" ? error.code : "";
  return /^messaging\/[a-z0-9-]{1,100}$/.test(code)
    ? code
    : "notification_send_failed";
}

function getNotificationContent(alertType, reminderTitle) {
  const alertText = {
    due_tomorrow: "due tomorrow",
    due_today: "due today",
    overdue: "overdue",
  }[alertType];

  if (!alertText) {
    return null;
  }

  return {
    title: `LifeVault reminder ${alertText}`,
    body: `${reminderTitle} is ${alertText}.`,
  };
}

async function markDeliveryFailed(delivery, errorCode, terminal = false) {
  const update = {
    $set: {
      status: "failed",
      lastErrorCode: errorCode,
    },
    $unset: { claimedAt: 1 },
  };
  const retryDelay = RETRY_DELAYS_MS[delivery.attempts];

  if (!terminal && retryDelay) {
    update.$set.nextAttemptAt = new Date(Date.now() + retryDelay);
  } else {
    update.$unset.nextAttemptAt = 1;
  }

  return NotificationDelivery.updateOne(
    {
      _id: delivery._id,
      status: "sending",
      claimedAt: delivery.claimedAt,
    },
    update
  );
}

async function markTerminal(delivery, errorCode, summary) {
  try {
    const result = await markDeliveryFailed(delivery, errorCode, true);
    if (result.modifiedCount > 0) {
      summary.terminalRecords += 1;
    } else {
      summary.recordsSkipped += 1;
    }
  } catch {
    summary.errorsEncountered += 1;
  }
}

async function claimDelivery(deliveryId, now, staleClaimTime) {
  return NotificationDelivery.findOneAndUpdate(
    {
      _id: deliveryId,
      attempts: { $lt: MAX_ATTEMPTS },
      $or: [
        { status: "pending" },
        {
          status: "failed",
          lastErrorCode: { $nin: TERMINAL_ERROR_CODES },
          $or: [
            { nextAttemptAt: { $exists: false } },
            { nextAttemptAt: { $lte: now } },
          ],
        },
        {
          status: "sending",
          claimedAt: { $lt: staleClaimTime },
        },
      ],
    },
    {
      $set: {
        status: "sending",
        claimedAt: now,
      },
      $unset: { nextAttemptAt: 1 },
      $inc: { attempts: 1 },
    },
    { returnDocument: "after" }
  ).lean();
}

async function recoverExhaustedClaim(delivery, staleClaimTime, summary) {
  try {
    const result = await NotificationDelivery.updateOne(
      {
        _id: delivery._id,
        status: "sending",
        attempts: { $gte: MAX_ATTEMPTS },
        claimedAt: { $lt: staleClaimTime },
      },
      {
        $set: {
          status: "failed",
          lastErrorCode: "max_attempts_exceeded",
        },
        $unset: { claimedAt: 1, nextAttemptAt: 1 },
      }
    );

    if (result.modifiedCount > 0) {
      summary.terminalRecords += 1;
    } else {
      summary.recordsSkipped += 1;
    }
  } catch {
    summary.errorsEncountered += 1;
  }
}

async function processClaimedDelivery(delivery, messaging, summary) {
  let reminder;
  let registration;

  try {
    [reminder, registration] = await Promise.all([
      Reminder.findById(delivery.reminder)
        .select("_id user isCompleted dueDate title")
        .lean(),
      PushRegistration.findById(delivery.pushRegistration)
        .select("_id user fid timezone")
        .lean(),
    ]);
  } catch (error) {
    try {
      await markDeliveryFailed(delivery, getSafeErrorCode(error));
      summary.failedRecords += 1;
    } catch {
      summary.errorsEncountered += 1;
    }
    return;
  }

  if (!reminder) {
    await markTerminal(delivery, "reminder_missing", summary);
    return;
  }

  if (reminder.isCompleted) {
    await markTerminal(delivery, "reminder_completed", summary);
    return;
  }

  if (getDueDateKey(reminder.dueDate) !== delivery.dueDateKey) {
    await markTerminal(delivery, "due_date_changed", summary);
    return;
  }

  if (!registration) {
    await markTerminal(delivery, "registration_missing", summary);
    return;
  }

  if (
    String(reminder.user) !== String(delivery.user) ||
    String(registration.user) !== String(delivery.user)
  ) {
    await markTerminal(delivery, "ownership_mismatch", summary);
    return;
  }

  const content = getNotificationContent(delivery.alertType, reminder.title);
  if (!content) {
    await markTerminal(delivery, "invalid_alert_type", summary);
    return;
  }

  let todayDateKey;
  if (
    typeof registration.timezone !== "string" ||
    !registration.timezone.trim()
  ) {
    await markTerminal(
      delivery,
      "invalid_registration_timezone",
      summary
    );
    return;
  }

  const timezone = registration.timezone.trim();
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    todayDateKey = getLocalDateKey(new Date(), timezone);
  } catch {
    await markTerminal(
      delivery,
      "invalid_registration_timezone",
      summary
    );
    return;
  }

  const tomorrowDateKey = getTomorrowDateKey(todayDateKey);
  const alertIsCurrent =
    (delivery.alertType === "due_tomorrow" &&
      delivery.dueDateKey === tomorrowDateKey) ||
    (delivery.alertType === "due_today" &&
      delivery.dueDateKey === todayDateKey) ||
    (delivery.alertType === "overdue" &&
      delivery.dueDateKey < todayDateKey);

  if (!alertIsCurrent) {
    await markTerminal(delivery, "alert_no_longer_current", summary);
    return;
  }

  try {
    await messaging.send({
      fid: registration.fid,
      data: {
        title: content.title,
        body: content.body,
      },
    });
  } catch (error) {
    try {
      await markDeliveryFailed(delivery, getSafeErrorCode(error));
      summary.failedRecords += 1;
    } catch {
      summary.errorsEncountered += 1;
    }
    return;
  }

  try {
    const result = await NotificationDelivery.updateOne(
      {
        _id: delivery._id,
        status: "sending",
        claimedAt: delivery.claimedAt,
      },
      {
        $set: {
          status: "sent",
          sentAt: new Date(),
        },
        $unset: {
          claimedAt: 1,
          nextAttemptAt: 1,
          lastErrorCode: 1,
        },
      }
    );

    if (result.modifiedCount > 0) {
      summary.sentRecords += 1;
    } else {
      summary.recordsSkipped += 1;
    }
  } catch {
    summary.errorsEncountered += 1;
  }
}

async function processPendingNotificationDeliveries() {
  const summary = {
    recordsConsidered: 0,
    recordsClaimed: 0,
    sentRecords: 0,
    failedRecords: 0,
    terminalRecords: 0,
    recordsSkipped: 0,
    errorsEncountered: 0,
  };
  const now = new Date();
  const staleClaimTime = new Date(now.getTime() - CLAIM_TIMEOUT_MS);
  let candidates;

  try {
    candidates = await NotificationDelivery.find({
      $or: [
        {
          status: "pending",
          attempts: { $lt: MAX_ATTEMPTS },
        },
        {
          status: "failed",
          attempts: { $lt: MAX_ATTEMPTS },
          lastErrorCode: { $nin: TERMINAL_ERROR_CODES },
          $or: [
            { nextAttemptAt: { $exists: false } },
            { nextAttemptAt: { $lte: now } },
          ],
        },
        {
          status: "sending",
          claimedAt: { $lt: staleClaimTime },
        },
      ],
    })
      .select("_id status attempts claimedAt")
      .sort({ createdAt: 1 })
      .limit(MAX_BATCH_SIZE)
      .lean();
  } catch {
    summary.errorsEncountered += 1;
    return summary;
  }

  summary.recordsConsidered = candidates.length;
  let messaging;

  for (const candidate of candidates) {
    if (
      candidate.status === "sending" &&
      candidate.attempts >= MAX_ATTEMPTS
    ) {
      await recoverExhaustedClaim(candidate, staleClaimTime, summary);
      continue;
    }

    let delivery;
    try {
      delivery = await claimDelivery(candidate._id, now, staleClaimTime);
    } catch {
      summary.errorsEncountered += 1;
      continue;
    }

    if (!delivery) {
      summary.recordsSkipped += 1;
      continue;
    }

    summary.recordsClaimed += 1;

    try {
      messaging = messaging || initializeFirebaseAdmin();
    } catch {
      try {
        await markDeliveryFailed(delivery, "firebase_admin_unavailable");
        summary.failedRecords += 1;
      } catch {
        summary.errorsEncountered += 1;
      }
      continue;
    }

    await processClaimedDelivery(delivery, messaging, summary);
  }

  return summary;
}

module.exports = { processPendingNotificationDeliveries };
