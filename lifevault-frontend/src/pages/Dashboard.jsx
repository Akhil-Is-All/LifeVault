
import { Link } from "react-router-dom";
import SummaryCard from "../components/SummaryCard";
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

function Dashboard({
  reminders,
  completedCount,
  onDelete,
  onToggleComplete,
}) {
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

  const completionPercentage =
    reminders.length === 0
      ? 0
      : Math.round((completedCount / reminders.length) * 100);

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Here's an overview of your life reminders.</p>

      <section className="cards">
        <SummaryCard title="Total Reminders" count={reminders.length} />
        <SummaryCard title="Completed" count={completedCount} />
        <SummaryCard title="Upcoming" count={upcomingReminders.length} />
        <SummaryCard title="Overdue" count={overdueCount} />
        <SummaryCard title="Due Today" count={dueTodayCount} />
        <SummaryCard
          title="Completion Rate"
          count={`${completionPercentage}%`}
        />
      </section>

      <ReminderList
        reminders={reminders}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
      />

      <Link className="page-link" to="/reminders">
        View All Reminders →
      </Link>
    </div>
  );
}

export default Dashboard;
