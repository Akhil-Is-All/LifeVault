const Reminder = require("../models/Reminder");
const PushRegistration = require("../models/PushRegistration");
const NotificationDelivery = require("../models/NotificationDelivery");

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

async function runReminderNotificationCheck() {
  const summary = {
    remindersChecked: 0,
    registrationsChecked: 0,
    deliveryRecordsCreated: 0,
    duplicateRecordsSkipped: 0,
    invalidTimezonesSkipped: 0,
    errorsEncountered: 0,
  };

  let reminders;
  let registrations;

  try {
    [reminders, registrations] = await Promise.all([
      Reminder.find({ isCompleted: false })
        .select("_id dueDate user")
        .lean(),
      PushRegistration.find({})
        .select("_id user timezone")
        .lean(),
    ]);
  } catch {
    summary.errorsEncountered += 1;
    return summary;
  }

  summary.remindersChecked = reminders.length;
  summary.registrationsChecked = registrations.length;

  const now = new Date();
  const registrationsByUser = new Map();

  for (const registration of registrations) {
    if (
      typeof registration.timezone !== "string" ||
      !registration.timezone.trim()
    ) {
      summary.invalidTimezonesSkipped += 1;
      continue;
    }

    const timezone = registration.timezone.trim();
    let todayDateKey;

    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone });
      todayDateKey = getLocalDateKey(now, timezone);
    } catch {
      summary.invalidTimezonesSkipped += 1;
      continue;
    }

    const tomorrowDateKey = getTomorrowDateKey(todayDateKey);
    if (!tomorrowDateKey) {
      summary.errorsEncountered += 1;
      continue;
    }

    const userId = String(registration.user);
    const userRegistrations = registrationsByUser.get(userId) || [];
    userRegistrations.push({
      registration,
      todayDateKey,
      tomorrowDateKey,
    });
    registrationsByUser.set(userId, userRegistrations);
  }

  for (const reminder of reminders) {
    const dueDateKey = getDueDateKey(reminder.dueDate);
    if (!dueDateKey) {
      summary.errorsEncountered += 1;
      continue;
    }

    const userRegistrations = registrationsByUser.get(String(reminder.user));
    if (!userRegistrations) continue;

    for (const {
      registration,
      todayDateKey,
      tomorrowDateKey,
    } of userRegistrations) {
      let alertType;

      if (dueDateKey === tomorrowDateKey) {
        alertType = "due_tomorrow";
      } else if (dueDateKey === todayDateKey) {
        alertType = "due_today";
      } else if (dueDateKey < todayDateKey) {
        alertType = "overdue";
      } else {
        continue;
      }

      try {
        const result = await NotificationDelivery.updateOne(
          {
            reminder: reminder._id,
            dueDateKey,
            pushRegistration: registration._id,
            alertType,
          },
          {
            $setOnInsert: {
              user: reminder.user,
              status: "pending",
              attempts: 0,
            },
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0 || result.upsertedId) {
          summary.deliveryRecordsCreated += 1;
        } else {
          summary.duplicateRecordsSkipped += 1;
        }
      } catch (error) {
        if (error.code === 11000) {
          summary.duplicateRecordsSkipped += 1;
        } else {
          summary.errorsEncountered += 1;
        }
      }
    }
  }

  return summary;
}

module.exports = { runReminderNotificationCheck };
