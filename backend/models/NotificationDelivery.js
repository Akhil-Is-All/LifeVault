const mongoose = require("mongoose");

const notificationDeliverySchema = new mongoose.Schema(
  {
    reminder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reminder",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    pushRegistration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PushRegistration",
      required: true,
    },
    dueDateKey: {
      type: String,
      required: true,
      validate: {
        validator(value) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return false;
          }

          const parsedDate = new Date(`${value}T00:00:00.000Z`);
          return (
            !Number.isNaN(parsedDate.getTime()) &&
            parsedDate.toISOString().slice(0, 10) === value
          );
        },
        message: "dueDateKey must be a valid date in YYYY-MM-DD format",
      },
    },
    alertType: {
      type: String,
      enum: ["due_tomorrow", "due_today", "overdue"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "sending", "sent", "failed"],
      default: "pending",
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    sentAt: {
      type: Date,
    },
    claimedAt: {
      type: Date,
    },
    nextAttemptAt: {
      type: Date,
    },
    lastErrorCode: {
      type: String,
      trim: true,
      maxlength: 120,
    },
  },
  { timestamps: true }
);

notificationDeliverySchema.index(
  { reminder: 1, dueDateKey: 1, pushRegistration: 1, alertType: 1 },
  { unique: true }
);

notificationDeliverySchema.index({
  status: 1,
  claimedAt: 1,
  nextAttemptAt: 1,
  createdAt: 1,
});

module.exports = mongoose.model(
  "NotificationDelivery",
  notificationDeliverySchema
);
