const PushRegistration = require("../models/PushRegistration");
const { initializeFirebaseAdmin } = require("../config/firebaseAdmin");

async function registerPushRegistration(req, res) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Request body must be a JSON object",
    });
  }

  const { fid, timezone } = body;

  if (typeof fid !== "string" || !fid.trim()) {
    return res.status(400).json({
      success: false,
      message: "A valid FID is required",
    });
  }

  if (typeof timezone !== "string" || !timezone.trim()) {
    return res.status(400).json({
      success: false,
      message: "A valid timezone is required",
    });
  }

  const normalizedFid = fid.trim();
  const normalizedTimezone = timezone.trim();

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: normalizedTimezone });
  } catch {
    return res.status(400).json({
      success: false,
      message: "A valid timezone is required",
    });
  }

  const registrationFields = {
    user: req.user._id,
    timezone: normalizedTimezone,
    lastRegisteredAt: new Date(),
  };

  try {
    try {
      await PushRegistration.findOneAndUpdate(
        { fid: normalizedFid },
        { $set: registrationFields },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }

      await PushRegistration.findOneAndUpdate(
        { fid: normalizedFid },
        { $set: registrationFields },
        {
          returnDocument: "after",
          runValidators: true,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Notification registration saved successfully",
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to save notification registration",
    });
  }
}

async function unregisterPushRegistration(req, res) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Request body must be a JSON object",
    });
  }

  const { fid } = body;
  if (typeof fid !== "string" || !fid.trim()) {
    return res.status(400).json({
      success: false,
      message: "A valid FID is required",
    });
  }

  try {
    await PushRegistration.findOneAndDelete({
      fid: fid.trim(),
      user: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Notification registration removed successfully",
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Failed to remove notification registration",
    });
  }
}

async function sendTestNotification(req, res) {
  try {
    const registration = await PushRegistration.findOne({
      user: req.user._id,
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "No notification registration found for this user",
      });
    }

    const messaging = initializeFirebaseAdmin();
    const messageId = await messaging.send({
      fid: registration.fid,
      data: {
        title: "LifeVault Test Notification",
        body: "Your background notifications are working!",
      },
    });

    return res.status(200).json({
      success: true,
      message: "Test notification sent successfully",
      messageId,
    });
  } catch (error) {
    console.error(
      "Test notification send failed:",
      error.code || error.name || "unknown error"
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send test notification",
    });
  }
}

module.exports = {
  registerPushRegistration,
  unregisterPushRegistration,
  sendTestNotification,
};