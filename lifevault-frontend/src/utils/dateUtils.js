export function getDaysLeft(dueDate) {
    if (!dueDate) return null;
  
    const [year, month, day] = String(dueDate)
      .slice(0, 10)
      .split("-")
      .map(Number);
  
    const due = new Date(year, month - 1, day);
    const today = new Date();
  
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
  
    return Math.round(
      (due - today) / (1000 * 60 * 60 * 24)
    );
  }
  