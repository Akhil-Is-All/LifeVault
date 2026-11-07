const Reminder = require("../models/Reminder");
const mongoose = require("mongoose");

function addCalendarMonths(date, months) {
  const nextDate = new Date(date);
  const originalDay = nextDate.getUTCDate();

  nextDate.setUTCDate(1);
  nextDate.setUTCMonth(nextDate.getUTCMonth() + months);

  const lastDayOfMonth = new Date(
    Date.UTC(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, 0)
  ).getUTCDate();

  nextDate.setUTCDate(Math.min(originalDay, lastDayOfMonth));
  return nextDate;
}

function calculateNextDueDate(dueDate, recurrence) {
  const nextDate = new Date(dueDate);

  switch (recurrence) {
    case "daily":
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      return nextDate;
    case "weekly":
      nextDate.setUTCDate(nextDate.getUTCDate() + 7);
      return nextDate;
    case "monthly":
      return addCalendarMonths(nextDate, 1);
    case "every_3_months":
      return addCalendarMonths(nextDate, 3);
    case "every_6_months":
      return addCalendarMonths(nextDate, 6);
    case "yearly":
      return addCalendarMonths(nextDate, 12);
    default:
      throw new Error("Unsupported reminder recurrence");
  }
}

// GET /api/reminders
// Fetch all reminders from MongoDB
async function getReminders(req, res) {
  try {
    const reminders = await Reminder.find({
      user: req.user._id,
    });

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reminders",
    });
  }
}

// GET /api/reminders/:id
// Fetch one reminder using its MongoDB ID
async function getReminderById(req, res) {
  try {
    const reminder = await Reminder.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    res.status(200).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid reminder ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to fetch reminder",
    });
  }
}

// GET /api/reminders/category/:category
// Fetch reminders belonging to a category
async function getReminderByCategory(req, res) {
  try {
    const category = req.params.category;

    const allowedCategories = [
      "Home",
      "Vehicle",
      "Health",
      "Documents",
      "Other",
    ];

    const validCategory = allowedCategories.find(
      (item) => item.toLowerCase() === category.toLowerCase()
    );

    if (!validCategory) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const reminders = await Reminder.find({
      category: validCategory,
      user: req.user._id,
    });

    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch reminders by category",
    });
  }
}

// POST /api/reminders
// Create and save a reminder in MongoDB
async function createReminder(req, res) {
  try {
    const {
      title,
      category,
      dueDate,
      recurrence = "none",
    } = req.body || {};

    const allowedCategories = [
      "Home",
      "Vehicle",
      "Health",
      "Documents",
      "Other",
    ];

    const allowedRecurrences = [
      "none",
      "daily",
      "weekly",
      "monthly",
      "every_3_months",
      "every_6_months",
      "yearly",
    ];
    
    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof category !== "string" ||
      !allowedCategories.includes(category) ||
      typeof dueDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      !allowedRecurrences.includes(recurrence)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid title, category, dueDate, and recurrence.",
      });
    }

    const parsedDueDate = new Date(`${dueDate}T00:00:00.000Z`);

    // Reject invalid calendar dates such as 2026-02-31
    if (
      Number.isNaN(parsedDueDate.getTime()) ||
      parsedDueDate.toISOString().slice(0, 10) !== dueDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid due date.",
      });
    }

    const newReminder = await Reminder.create({
      title: title.trim(),
      category,
      dueDate: parsedDueDate,
      recurrence,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Reminder created successfully",
      data: newReminder,
    });
  } catch (error) {
    console.error("Create reminder error:", error);
  
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  
    res.status(500).json({
      success: false,
      message: "Failed to create reminder",
    });
  }
}

// PATCH /api/reminders/:id
// Update an existing reminder
async function updateReminder(req, res) {
  let session;

  try {
    if (
      !req.body ||
      typeof req.body !== "object" ||
      Array.isArray(req.body)
    ) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a JSON object",
      });
    }

    const allowedFields = [
      "title",
      "category",
      "dueDate",
      "recurrence",
      "isCompleted",
    ];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body && req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }
    if (
      req.body.isCompleted !== undefined &&
      typeof req.body.isCompleted !== "boolean"
    ) {
      return res.status(400).json({
        message: "isCompleted must be a boolean",
      });
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid field to update",
      });
    }

    const allowedCategories = [
      "Home",
      "Vehicle",
      "Health",
      "Documents",
      "Other",
    ];

    const allowedRecurrences = [
      "none",
      "daily",
      "weekly",
      "monthly",
      "every_3_months",
      "every_6_months",
      "yearly",
    ];
    
    if (
      updates.recurrence !== undefined &&
      !allowedRecurrences.includes(updates.recurrence)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid recurrence option",
      });
    }

    if (
      updates.title !== undefined &&
      (typeof updates.title !== "string" || !updates.title.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid title",
      });
    }

    if (
      updates.category !== undefined &&
      !allowedCategories.includes(updates.category)
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid category",
      });
    }

    if (updates.title !== undefined) {
      updates.title = updates.title.trim();
    }

    if (updates.dueDate !== undefined) {
      if (
        typeof updates.dueDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(updates.dueDate)
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid due date",
        });
      }

      const parsedDueDate = new Date(
        `${updates.dueDate}T00:00:00.000Z`
      );

      if (
        Number.isNaN(parsedDueDate.getTime()) ||
        parsedDueDate.toISOString().slice(0, 10) !== updates.dueDate
      ) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid due date",
        });
      }

      updates.dueDate = parsedDueDate;
    }

    let updatedReminder;
    let reminderNotFound = false;

    session = await mongoose.startSession();
    await session.withTransaction(async () => {
      updatedReminder = null;
      reminderNotFound = false;

      const currentReminder = await Reminder.findOne({
        _id: req.params.id,
        user: req.user._id,
      }).session(session);

      if (!currentReminder) {
        reminderNotFound = true;
        return;
      }

      const wasPending = currentReminder.isCompleted === false;
      updatedReminder = await Reminder.findOneAndUpdate(
        {
          _id: req.params.id,
          user: req.user._id,
          isCompleted: currentReminder.isCompleted,
        },
        updates,
        {
          returnDocument: "after",
          runValidators: true,
          session,
        }
      );

      if (!updatedReminder) {
        reminderNotFound = true;
        return;
      }

      const justCompleted = wasPending && updates.isCompleted === true;
      if (justCompleted && updatedReminder.recurrence !== "none") {
        const existingNextReminder = await Reminder.findOne({
          generatedFrom: updatedReminder._id,
          user: updatedReminder.user,
        }).session(session);

        if (!existingNextReminder) {
          const nextReminder = new Reminder({
            title: updatedReminder.title,
            category: updatedReminder.category,
            dueDate: calculateNextDueDate(
              updatedReminder.dueDate,
              updatedReminder.recurrence
            ),
            recurrence: updatedReminder.recurrence,
            isCompleted: false,
            user: updatedReminder.user,
            generatedFrom: updatedReminder._id,
          });

          await nextReminder.save({ session });
        }
      }
    });

    if (reminderNotFound || !updatedReminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reminder updated successfully",
      data: updatedReminder,
    });
  } catch (error) {
    if (error.code === 11000) {
      try {
        const [currentReminder, nextReminder] = await Promise.all([
          Reminder.findOne({
            _id: req.params.id,
            user: req.user._id,
          }),
          Reminder.findOne({
            generatedFrom: req.params.id,
            user: req.user._id,
          }),
        ]);

        if (currentReminder && currentReminder.isCompleted && nextReminder) {
          return res.status(200).json({
            success: true,
            message: "Reminder updated successfully",
            data: currentReminder,
          });
        }
      } catch (lookupError) {
        return res.status(500).json({
          success: false,
          message: "Failed to update reminder",
        });
      }
    }

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid reminder ID",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update reminder",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}

// DELETE /api/reminders/:id
// Delete a reminder
async function deleteReminder(req, res) {
  try {
    const deletedReminder = await Reminder.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deletedReminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Reminder deleted successfully",
      data: deletedReminder,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid reminder ID",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete reminder",
    });
  }
}

module.exports = {
  getReminders,
  getReminderById,
  createReminder,
  getReminderByCategory,
  updateReminder,
  deleteReminder,
};
