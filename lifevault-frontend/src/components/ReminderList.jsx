
import { EmptyState } from "./FeedbackStates";

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
  variant,
  description,
  heading = "My Reminders",
  emptyMessage = "No reminders available.",
  emptyTitle = "No reminders available",
  emptyAction,
  busyReminderIds = [],
}) {
  const isDashboard = variant === "dashboard";
  const isManagement = variant === "management";
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
    <div
      className={`reminder-section${isDashboard ? " dashboard-reminder-list" : ""}${isManagement ? " management-reminder-list" : ""}`}
    >
      <div className="reminder-section-heading">
        <div>
          <h2>{heading}</h2>
          {description && <p>{description}</p>}
        </div>
        {isManagement && (
          <span className="management-reminder-count">
            {reminders.length} {reminders.length === 1 ? "reminder" : "reminders"}
          </span>
        )}
      </div>

      {isDashboard && sortedReminders.length > 0 && (
        <div className="dashboard-reminder-columns" aria-hidden="true">
          <span>Reminder</span>
          <span>Category</span>
          <span>Due date</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
      )}
      {isManagement && sortedReminders.length > 0 && (
        <div className="management-reminder-columns" aria-hidden="true">
          <span>Reminder</span>
          <span>Category</span>
          <span>Due date</span>
          <span>Repeat</span>
          <span>Status</span>
          <span>Actions</span>
        </div>
      )}

      {sortedReminders.length === 0 ? (
        <EmptyState
          action={emptyAction}
          description={emptyMessage}
          title={emptyTitle}
        />
      ) : (
        <ul>
          {sortedReminders.map((reminder) => {
            const isUpdating = busyReminderIds.includes(reminder._id);
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

            const statusBadge = reminder.isCompleted ? (
              <span className="status-badge completed">
                Completed
              </span>
            ) : (
              <span className={`status-badge ${status}`}>
                {statusText}
              </span>
            );

            const actionButtons = (
              <>
                <button
                  className="reminder-action-primary"
                  disabled={isUpdating}
                  type="button"
                  onClick={() => onToggleComplete(reminder)}
                >
                  {isUpdating ? (
                    <>
                      <span className="feedback-spinner feedback-spinner--blue" aria-hidden="true" />
                      Updating...
                    </>
                  ) : reminder.isCompleted ? (
                    "Mark Pending"
                  ) : (
                    "Mark Complete"
                  )}
                </button>

                {onEdit && (
                  <button
                    className="reminder-action-secondary"
                    type="button"
                    onClick={() => onEdit(reminder)}
                  >
                    Edit
                  </button>
                )}

                <button
                  className="reminder-action-danger"
                  type="button"
                  onClick={() => onDelete(reminder._id)}
                >
                  Delete
                </button>
              </>
            );

            return (
              <li key={reminder._id}>
                <strong
                  className={
                    isManagement
                      ? "management-reminder-title"
                      : undefined
                  }
                  data-label="Reminder"
                >
                  {reminder.title}
                </strong>

                {isDashboard || isManagement ? (
                  <span
                    className={`${isDashboard ? "dashboard" : "management"}-reminder-category`}
                    data-label="Category"
                  >
                    {reminder.category}
                  </span>
                ) : (
                  <span>{reminder.category}</span>
                )}

                {isDashboard || isManagement ? (
                  <span
                    className={`${isDashboard ? "dashboard" : "management"}-reminder-due`}
                    data-label="Due date"
                  >
                    {reminder.dueDate
                      ? String(reminder.dueDate).slice(0, 10)
                      : "Not set"}
                  </span>
                ) : (
                  <span>
                    Due:{" "}
                    {reminder.dueDate
                      ? String(reminder.dueDate).slice(0, 10)
                      : "Not set"}
                  </span>
                )}

                {isManagement && (
                  <span
                    className="management-reminder-repeat"
                    data-label="Repeat"
                  >
                    {reminder.recurrence === "daily"
                      ? "Daily"
                      : reminder.recurrence === "weekly"
                        ? "Weekly"
                        : reminder.recurrence === "monthly"
                          ? "Monthly"
                          : reminder.recurrence === "every_3_months"
                            ? "Every 3 months"
                            : reminder.recurrence === "every_6_months"
                              ? "Every 6 months"
                              : reminder.recurrence === "yearly"
                                ? "Yearly"
                                : "Does not repeat"}
                  </span>
                )}

                {isDashboard || isManagement ? (
                  <span
                    className={`${isDashboard ? "dashboard" : "management"}-reminder-status`}
                    data-label="Status"
                  >
                    {statusBadge}
                  </span>
                ) : (
                  statusBadge
                )}

                {isDashboard || isManagement ? (
                  <div
                    className={
                      isDashboard
                        ? "dashboard-reminder-actions"
                        : "management-reminder-actions"
                    }
                    data-label="Actions"
                  >
                    {actionButtons}
                  </div>
                ) : (
                  actionButtons
                )}

              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default ReminderList;
