const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Reminder title is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Reminder category is required"],
      enum: ["Home", "Vehicle", "Health", "Documents", "Other"],
    },

    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    recurrence: {
      type: String,
      enum: [
        "none",
        "daily",
        "weekly",
        "monthly",
        "every_3_months",
        "every_6_months",
        "yearly",
      ],
      default: "none",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    generatedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reminder",
      default: null,
    },
  },
  { timestamps: true }
);

reminderSchema.index(
  { generatedFrom: 1, user: 1 },
  {
    unique: true,
    partialFilterExpression: {
      generatedFrom: { $type: "objectId" },
    },
  }
);

const Reminder = mongoose.model("Reminder", reminderSchema);

module.exports = Reminder;
