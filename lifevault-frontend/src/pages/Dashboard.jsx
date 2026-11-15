import { useLayoutEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReminderList from "../components/ReminderList";

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

function StatIcon({ name }) {
  const icons = {
    total: (
      <>
        <rect x="4" y="4" width="7" height="7" rx="1.5" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" />
      </>
    ),
    completed: <path d="m5 12 4 4L19 6" />,
    upcoming: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
    overdue: (
      <>
        <path d="M12 3.5 21 20H3l9-16.5Z" />
        <path d="M12 9v4.5M12 17h.01" />
      </>
    ),
    today: (
      <>
        <rect x="3.5" y="5" width="17" height="16" rx="2" />
        <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17M8 13h3M8 16.5h3" />
      </>
    ),
    completion: (
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 4-4 3 2 5-6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}

function Dashboard({
  reminders,
  completedCount,
  onDelete,
  onToggleComplete,
  notificationSupported,
  notificationPermission,
  messagingRegistrationStatus,
  onEnableNotifications,
  busyReminderIds,
}) {
  const [activeReminderFilter, setActiveReminderFilter] = useState("all");

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const upcomingReminders = reminders.filter((reminder) => {
    const daysLeft = getDaysLeft(reminder.dueDate);

    return (
      !reminder.isCompleted &&
      daysLeft !== null &&
      daysLeft > 0
    );
  });

  const overdueCount = reminders.filter((reminder) => {
    const daysLeft = getDaysLeft(reminder.dueDate);

    return (
      !reminder.isCompleted &&
      daysLeft !== null &&
      daysLeft < 0
    );
  }).length;

  const dueTodayCount = reminders.filter((reminder) => {
    const daysLeft = getDaysLeft(reminder.dueDate);

    return (
      !reminder.isCompleted &&
      daysLeft === 0
    );
  }).length;
  const pendingCount = reminders.filter(
    (reminder) => !reminder.isCompleted
  ).length;
  const filteredReminders = reminders.filter((reminder) => {
    if (activeReminderFilter === "pending") {
      return !reminder.isCompleted;
    }

    if (activeReminderFilter === "completed") {
      return reminder.isCompleted;
    }

    if (activeReminderFilter === "overdue") {
      const daysLeft = getDaysLeft(reminder.dueDate);

      return !reminder.isCompleted && daysLeft !== null && daysLeft < 0;
    }

    return true;
  });

  const completionPercentage =
    reminders.length === 0
      ? 0
      : Math.round((completedCount / reminders.length) * 100);

  const statistics = [
    {
      title: "Total Reminders",
      count: reminders.length,
      icon: "total",
      tone: "blue",
    },
    {
      title: "Completed",
      count: completedCount,
      icon: "completed",
      tone: "green",
    },
    {
      title: "Upcoming",
      count: upcomingReminders.length,
      icon: "upcoming",
      tone: "violet",
    },
    {
      title: "Overdue",
      count: overdueCount,
      icon: "overdue",
      tone: "red",
    },
    {
      title: "Due Today",
      count: dueTodayCount,
      icon: "today",
      tone: "amber",
    },
    {
      title: "Completion Rate",
      count: `${completionPercentage}%`,
      icon: "completion",
      tone: "navy",
    },
  ];

  const reminderFilters = [
    { id: "all", label: "All", count: reminders.length },
    { id: "pending", label: "Pending", count: pendingCount },
    { id: "completed", label: "Completed", count: completedCount },
    { id: "overdue", label: "Overdue", count: overdueCount },
  ];

  return (
    <div className="dashboard-page">
      <section
        className="dashboard-welcome"
        aria-labelledby="dashboard-heading"
      >
        <p className="dashboard-eyebrow">YOUR WORKSPACE</p>
        <h2 id="dashboard-heading">A clearer view of what matters.</h2>
        <p>Keep your important plans and personal reminders on track.</p>
      </section>

      <section
        className="dashboard-stats"
        aria-label="Reminder statistics"
      >
        {statistics.map((statistic) => (
          <article
            className={`dashboard-stat-card dashboard-stat-card--${statistic.tone}`}
            key={statistic.title}
          >
            <span className="dashboard-stat-icon">
              <StatIcon name={statistic.icon} />
            </span>
            <div className="dashboard-stat-copy">
              <p>{statistic.count}</p>
              <h3>{statistic.title}</h3>
            </div>
          </article>
        ))}
      </section>

      <section
        className="dashboard-notifications"
        aria-labelledby="notifications-heading"
      >
        <span className="dashboard-notification-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
          </svg>
        </span>
        <div className="dashboard-notification-copy">
          <h2 id="notifications-heading">Browser Notifications</h2>
          <p className="dashboard-notification-status" role="status">
            {!notificationSupported
              ? "Browser notifications are not supported in this browser."
              : notificationPermission === "granted"
                ? "Notifications Enabled"
                : notificationPermission === "denied"
                  ? "Notifications are blocked. Change this site's notification permission in your browser settings, then reload LifeVault."
                  : "Notification permission has not been granted."}
          </p>

          {notificationSupported && notificationPermission === "granted" && (
            <div className="dashboard-notification-detail">
              {messagingRegistrationStatus === "registered" ? (
                <p role="status">
                  This browser is registered for background notifications.
                </p>
              ) : messagingRegistrationStatus === "registering" ? (
                <p role="status">
                  Registering this browser for background notifications...
                </p>
              ) : messagingRegistrationStatus === "unsupported" ? (
                <p role="status">
                  Background notifications are not supported in this browser.
                </p>
              ) : messagingRegistrationStatus === "error" ? (
                <p role="alert">
                  Could not register this browser for background notifications.
                  Please try again.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <div className="dashboard-notification-actions">
          {notificationSupported && notificationPermission === "granted" && (
            <>
              {messagingRegistrationStatus === "error" ? (
                <button type="button" onClick={onEnableNotifications}>
                  Retry Background Notifications
                </button>
              ) : messagingRegistrationStatus !== "registered" &&
                messagingRegistrationStatus !== "registering" &&
                messagingRegistrationStatus !== "unsupported" ? (
                <button type="button" onClick={onEnableNotifications}>
                  Enable Background Notifications
                </button>
              ) : null}
            </>
          )}

          {notificationSupported && notificationPermission === "default" && (
            <button type="button" onClick={onEnableNotifications}>
              Enable Notifications
            </button>
          )}
        </div>
      </section>

      <section
        className="dashboard-reminder-panel"
        aria-label="My Reminders"
      >
        <div className="dashboard-filter-tabs" role="group" aria-label="Filter reminders">
          {reminderFilters.map((filter) => (
            <button
              aria-pressed={activeReminderFilter === filter.id}
              className="dashboard-filter-tab"
              key={filter.id}
              onClick={() => setActiveReminderFilter(filter.id)}
              type="button"
            >
              {filter.label}
              <span>{filter.count}</span>
            </button>
          ))}
        </div>

        <div className="dashboard-reminders">
        <ReminderList
          reminders={filteredReminders}
          onDelete={onDelete}
          onToggleComplete={onToggleComplete}
          busyReminderIds={busyReminderIds}
          variant="dashboard"
          description="A quick look at the reminders that need your attention."
          emptyMessage={
            reminders.length === 0
              ? "Add a reminder to start keeping important plans in view."
              : "There are no reminders in this view right now."
          }
          emptyTitle={
            reminders.length === 0
              ? "Your plans start here"
              : "Nothing to show"
          }
          emptyAction={
            reminders.length === 0 ? (
              <Link className="feedback-empty-action" to="/reminders">
                Add a reminder
              </Link>
            ) : null
          }
        />
        </div>
      </section>

      <Link className="dashboard-view-all" to="/reminders">
        View All Reminders <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

export default Dashboard;
