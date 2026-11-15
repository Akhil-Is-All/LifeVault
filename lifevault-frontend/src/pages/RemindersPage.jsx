import { useRef, useState } from "react";
import {
  createReminder,
  updateReminder,
} from "../services/reminderService";
import ReminderList from "../components/ReminderList";
import { useFeedback } from "../components/FeedbackContext";
import { getUserFacingError } from "../components/feedbackUtils";

function RemindersPage({
  reminders,
  setReminders,
  onDelete,
  onToggleComplete,
  busyReminderIds,
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Home");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [recurrence, setRecurrence] = useState("none");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);
  const submissionInFlightRef = useRef(false);
  const { showToast } = useFeedback();

  const filteredReminders = reminders.filter((reminder) => {
    const matchesSearch = reminder.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory =
      filterCategory === "All" ||
      reminder.category === filterCategory;

    const matchesStatus =
      filterStatus === "All" ||
      (filterStatus === "Completed" && reminder.isCompleted) ||
      (filterStatus === "Pending" && !reminder.isCompleted);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setCategory("Home");
    setDueDate("");
    setRecurrence("none");
    setFormError("");
  }

  function handleEdit(reminder) {
    setFormError("");
    setEditingId(reminder._id);
    setTitle(reminder.title);
    setCategory(reminder.category);
    setRecurrence(reminder.recurrence || "none");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    setDueDate(
      reminder.dueDate
        ? String(reminder.dueDate).slice(0, 10)
        : ""
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionInFlightRef.current) return;
    setFormError("");

    if (!title.trim() || !dueDate) {
      setFormError("Please enter a reminder title and due date.");
      return;
    }

    const reminderData = {
      title: title.trim(),
      category,
      dueDate,
      recurrence,
    };

    submissionInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const savedReminder = await createReminder(reminderData);

      setReminders((previousReminders) => [
        ...previousReminders,
        savedReminder,
      ]);

      resetForm();
      showToast("Reminder added successfully.");
    } catch (error) {
      console.error("Error creating reminder:", error);
      setFormError(
        getUserFacingError(error, "Unable to save reminder. Please try again.")
      );
    } finally {
      submissionInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (submissionInFlightRef.current) return;
    setFormError("");

    if (!title.trim() || !dueDate) {
      setFormError("Please enter a reminder title and due date.");
      return;
    }

    const updatedData = {
      title: title.trim(),
      category,
      dueDate,
      recurrence,
    };

    submissionInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const updatedReminder = await updateReminder(
        editingId,
        updatedData
      );

      setReminders((previousReminders) =>
        previousReminders.map((reminder) =>
          reminder._id === editingId
            ? { ...reminder, ...updatedReminder }
            : reminder
        )
      );

      resetForm();
      showToast("Reminder updated successfully.");
    } catch (error) {
      console.error("Error updating reminder:", error);
      setFormError(
        getUserFacingError(error, "Unable to update reminder. Please try again.")
      );
    } finally {
      submissionInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <div className="reminders-page">
      <header className="reminders-page-heading">
        <div>
          <p className="reminders-page-eyebrow">YOUR WORKSPACE</p>
          <h2>Manage Reminders</h2>
          <p>Organize your plans, deadlines and recurring tasks in one place.</p>
        </div>
        <a className="reminders-add-link" href="#reminder-form">
          <span aria-hidden="true">+</span>
          Add Reminder
        </a>
      </header>

      <form
        className="reminder-form reminders-form"
        id="reminder-form"
        ref={formRef}
        onSubmit={editingId ? handleUpdate : handleSubmit}
      >
        <div className="reminders-form-heading">
          <div>
            <h3>{editingId ? "Edit Reminder" : "Add a Reminder"}</h3>
            <p>
              {editingId
                ? "Update the details and schedule for this reminder."
                : "Capture an important task so it stays on your radar."}
            </p>
          </div>
          {editingId && <span className="reminders-edit-indicator">Editing</span>}
        </div>

        <div className="reminders-form-fields">
          <div className="form-group reminders-title-field">
            <label htmlFor="title">Reminder Title</label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Renew car insurance"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="Home">Home</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Health">Health</option>
              <option value="Documents">Documents</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="recurrence">Repeat</label>
            <select
              id="recurrence"
              value={recurrence}
              onChange={(event) => setRecurrence(event.target.value)}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="every_3_months">Every 3 months</option>
              <option value="every_6_months">Every 6 months</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>

        {formError && (
          <p className="reminders-form-error" role="alert">
            <span aria-hidden="true">!</span>
            {formError}
          </p>
        )}

        <div className="reminders-form-actions">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="feedback-spinner" aria-hidden="true" />
                {editingId ? "Updating..." : "Saving..."}
              </>
            ) : editingId ? (
              "Save Changes"
            ) : (
              "Add Reminder"
            )}
          </button>
          {editingId && (
            <button
              className="reminders-cancel-button"
              disabled={isSubmitting}
              type="button"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <section className="reminders-management" aria-label="Reminder management">
        <div className="reminders-toolbar-heading">
          <div>
            <h2>All reminders</h2>
            <p>Search and filter your personal reminder list.</p>
          </div>
          <span>
            Showing {filteredReminders.length} of {reminders.length}
          </span>
        </div>

        <div className="reminder-filters reminders-toolbar">
          <label className="reminders-search">
            <span className="reminders-search-icon" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" />
              </svg>
            </span>
            <span className="visually-hidden">Search reminders</span>
            <input
              type="text"
              placeholder="Search by reminder title..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <label>
            <span className="visually-hidden">Filter by category</span>
            <select
              value={filterCategory}
              onChange={(event) => setFilterCategory(event.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="Home">Home</option>
              <option value="Vehicle">Vehicle</option>
              <option value="Health">Health</option>
              <option value="Documents">Documents</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            <span className="visually-hidden">Filter by completion status</span>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </label>
        </div>

        <ReminderList
          reminders={filteredReminders}
          onDelete={onDelete}
          onEdit={handleEdit}
          onToggleComplete={onToggleComplete}
          busyReminderIds={busyReminderIds}
          variant="management"
          heading="Your reminders"
          description="Review due dates, recurring schedules and task status."
          emptyMessage={
            reminders.length === 0
              ? "No reminders yet. Add one above to get started."
              : "No reminders match your search or filters."
          }
          emptyTitle={
            reminders.length === 0
              ? "Start with one reminder"
              : "No matching reminders"
          }
          emptyAction={
            reminders.length === 0 ? (
              <a className="feedback-empty-action" href="#reminder-form">
                Add your first reminder
              </a>
            ) : (
              <button
                className="feedback-empty-action"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("All");
                  setFilterStatus("All");
                }}
                type="button"
              >
                Clear filters
              </button>
            )
          }
        />
      </section>
    </div>
  );
}

export default RemindersPage;
