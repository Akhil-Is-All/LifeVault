import { useEffect, useState } from "react";
import {
  getReminders,
  updateReminder,
  deleteReminder,
} from "./services/reminderService";

import {
  Link,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import RemindersPage from "./pages/RemindersPage";

import "./App.css";

// Reusable summary card



// Dashboard page



// Reminders page


function App() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);

  const [token, setToken] = useState(
    () => localStorage.getItem("lifevault_token")
  );

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("lifevault_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const completedCount = reminders.filter(
    (reminder) => reminder.isCompleted
  ).length;

  function handleLogout() {
    localStorage.removeItem("lifevault_token");
    localStorage.removeItem("lifevault_user");

    setToken(null);
    setCurrentUser(null);
    setReminders([]);
    setError("");

    navigate("/login", { replace: true });
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchReminders() {
      if (!token) {
        setReminders([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const data = await getReminders();

        if (!cancelled) {
          setReminders(data);
        }
      } catch (err) {
        if (cancelled) return;

        console.error("Error fetching reminders:", err);

        if (err.response?.status === 401) {
          handleLogout();
          return;
        }

        setError("Unable to load reminders. Please try again.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchReminders();

    return () => {
      cancelled = true;
    };
  }, [token, refreshKey]);

  function handleLoginSuccess(user) {
    setToken(localStorage.getItem("lifevault_token"));
    setCurrentUser(user);
    setError("");
    navigate("/", { replace: true });
  }

  function handleRegistrationSuccess(user) {
    setToken(localStorage.getItem("lifevault_token"));
    setCurrentUser(user);
    setError("");
    navigate("/", { replace: true });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reminder?"
    );

    if (!confirmed) return;

    try {
      await deleteReminder(id);

      setReminders((previousReminders) =>
        previousReminders.filter((reminder) => reminder._id !== id)
      );
    } catch (err) {
      console.error("Error deleting reminder:", err);

      if (err.response?.status === 401) {
        handleLogout();
        return;
      }

      alert(
        err.response?.data?.message ||
          "Unable to delete reminder. Please try again."
      );
    }
  }
const handleToggleComplete = async (reminder) => {
  try {
    await updateReminder(
      reminder._id,
      { isCompleted: !reminder.isCompleted }
    );

    // Fetch the latest reminders, including newly generated ones
    const latestReminders = await getReminders();

    setReminders(latestReminders);

  } catch (error) {
    if (error.response?.status === 401) {
      handleLogout();
      return;
    }

    setError(
      error.response?.data?.message ||
      "Could not update reminder status."
    );
  }
};

  return (
    <div className="app">
      <header>
        <h1>LifeVault</h1>
        <p>Never forget what needs attention.</p>

        {token && (
          <div className="user-header">
            <span>
              Welcome{currentUser?.name ? `, ${currentUser.name}` : ""}!
            </span>

            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </header>

      {token && (
        <nav className="navbar">
          <Link to="/">Dashboard</Link>
          <Link to="/reminders">Reminders</Link>
        </nav>
      )}

      <main>
        <Routes>
          <Route
            path="/login"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          <Route
            path="/register"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <Register
                  onRegistrationSuccess={handleRegistrationSuccess}
                />
              )
            }
          />

          <Route
            path="/"
            element={
              !token ? (
                <Navigate to="/login" replace />
              ) : loading ? (
                <p>Loading LifeVault...</p>
              ) : error ? (
                <div>
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => setRefreshKey((previous) => previous + 1)}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <Dashboard
                reminders={reminders}
                completedCount={completedCount}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
              )
            }
          />

          <Route
            path="/reminders"
            element={
              !token ? (
                <Navigate to="/login" replace />
              ) : loading ? (
                <p>Loading LifeVault...</p>
              ) : error ? (
                <p>{error}</p>
              ) : (
                <RemindersPage
                reminders={reminders}
                setReminders={setReminders}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
              />
              )
            }
          />



          <Route
            path="*"
            element={
              <div>
                <h2>404 - Page Not Found</h2>
                <Link to="/">Return to Dashboard</Link>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;

