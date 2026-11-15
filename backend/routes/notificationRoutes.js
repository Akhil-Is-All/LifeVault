const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  registerPushRegistration,
  unregisterPushRegistration,
  sendTestNotification,
} = require("../controllers/notificationController");

const router = express.Router();

router.post("/register", protect, registerPushRegistration);
router.delete("/register", protect, unregisterPushRegistration);
router.post("/test", protect, sendTestNotification);

module.exports = router;