
function getDaysLeft(dueDate) {
  if (!dueDate) return null;

  const [year, month, day] = String(dueDate)
    .slice(0, 10)
    .split("-")
    .map(Number);

  const due = new Date(year, month - 1, day);
  const today = new Date();

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  return Math.round((due - today) / (1000 * 60 * 60 * 24));
}

function ReminderList({
  reminders,
  onDelete,
  onEdit,
  onToggleComplete,
}) {
  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }

    const daysA = getDaysLeft(a.dueDate);
    const daysB = getDaysLeft(b.dueDate);

    if (daysA === null) return daysB === null ? 0 : 1;
    if (daysB === null) return -1;

    return daysA - daysB;
  });

  return (
    <div className="reminder-section">
      <h2>My Reminders</h2>

      {sortedReminders.length === 0 ? (
        <p>No reminders available.</p>
      ) : (
        <ul>
          {sortedReminders.map((reminder) => {
            const daysLeft = getDaysLeft(reminder.dueDate);

            let status = "upcoming";
            let statusText = `${daysLeft} days left`;

            if (daysLeft === null) {
              statusText = "Date not set";
            } else if (daysLeft < 0) {
              status = "overdue";
              const overdueDays = Math.abs(daysLeft);

              statusText =
                overdueDays === 1
                  ? "Overdue by 1 day"
                  : `Overdue by ${overdueDays} days`;
            } else if (daysLeft === 0) {
              status = "due-today";
              statusText = "Due Today";
            } else if (daysLeft <= 3) {
              status = "due-soon";
              statusText =
                daysLeft === 1
                  ? "Due Soon · 1 day left"
                  : `Due Soon · ${daysLeft} days left`;
            }

            return (
              <li key={reminder._id}>
                <strong>{reminder.title}</strong>

                <span>{reminder.category}</span>

                <span>
                  Due:{" "}
                  {reminder.dueDate
                    ? String(reminder.dueDate).slice(0, 10)
                    : "Not set"}
                </span>

                {reminder.isCompleted ? (
                  <span className="status-badge completed">
                    Completed
                  </span>
                ) : (
                  <span className={`status-badge ${status}`}>
                    {statusText}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onToggleComplete(reminder)}
                >
                  {reminder.isCompleted
                    ? "Mark Pending"
                    : "Mark Complete"}
                </button>

                {onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(reminder)}
                  >
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onDelete(reminder._id)}
                >
                  Delete
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ReminderList;
