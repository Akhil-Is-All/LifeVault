const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  getReminders,
  getReminderById,
  createReminder,
  getReminderByCategory,
  updateReminder,
  deleteReminder,
} = require("../controllers/reminderController");

const router = express.Router();

router.use(protect);

router.get("/", getReminders);

router.get("/category/:category", getReminderByCategory);

router.get("/:id", getReminderById);

router.post("/", createReminder);

router.patch("/:id", updateReminder);

router.delete("/:id", deleteReminder);

module.exports = router;