
import { useState } from "react";
import {
  createReminder,
  updateReminder,
} from "../services/reminderService";
import ReminderList from "../components/ReminderList";

function RemindersPage({
  reminders,
  setReminders,
  onDelete,
  onToggleComplete,
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Home");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [recurrence, setRecurrence] = useState("none");

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
  }

  function handleEdit(reminder) {
    setEditingId(reminder._id);
    setTitle(reminder.title);
    setCategory(reminder.category);
    setRecurrence(reminder.recurrence || "none");

    setDueDate(
      reminder.dueDate
        ? String(reminder.dueDate).slice(0, 10)
        : ""
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !dueDate) {
      alert("Please enter a reminder title and due date.");
      return;
    }

    const reminderData = {
      title: title.trim(),
      category,
      dueDate,
      recurrence,
    };

    try {
      const savedReminder = await createReminder(reminderData);

      setReminders((previousReminders) => [
        ...previousReminders,
        savedReminder,
      ]);

      resetForm();
      alert("Reminder saved successfully!");
    } catch (error) {
      console.error("Error creating reminder:", error);

      alert(
        error.response?.data?.message ||
          "Unable to save reminder. Please try again."
      );
    }
  }

  async function handleUpdate(event) {
    event.preventDefault();

    if (!title.trim() || !dueDate) {
      alert("Please enter a reminder title and due date.");
      return;
    }

    const updatedData = {
      title: title.trim(),
      category,
      dueDate,
      recurrence,
    };

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
      alert("Reminder updated successfully!");
    } catch (error) {
      console.error("Error updating reminder:", error);

      alert(
        error.response?.data?.message ||
          "Unable to update reminder. Please try again."
      );
    }
  }

  return (
    <div>
      <h2>Manage Reminders</h2>
      <p>Add and view your personal reminders.</p>

      <form
        className="reminder-form"
        onSubmit={editingId ? handleUpdate : handleSubmit}
      >
        <h3>{editingId ? "Edit Reminder" : "Add a Reminder"}</h3>

        <label htmlFor="title">Reminder Title</label>

        <input
          id="title"
          type="text"
          placeholder="e.g. Renew car insurance"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />

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

        <label htmlFor="dueDate">Due Date</label>

        <input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          required
        />

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

        <button type="submit">
          {editingId ? "Save Changes" : "Add Reminder"}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      <div className="reminder-filters">
        <input
          type="text"
          placeholder="Search reminders..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

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

        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <ReminderList
        reminders={filteredReminders}
        onDelete={onDelete}
        onEdit={handleEdit}
        onToggleComplete={onToggleComplete}
      />
    </div>
  );
}

export default RemindersPage;
