const mongoose = require("mongoose");

const pushRegistrationSchema = new mongoose.Schema(
  {
    fid: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
    },
    lastRegisteredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

pushRegistrationSchema.index({ fid: 1 }, { unique: true });

module.exports = mongoose.model("PushRegistration", pushRegistrationSchema);