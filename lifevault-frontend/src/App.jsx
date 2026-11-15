import { useEffect, useRef, useState } from "react";
import { onMessage, onRegistered, register } from "firebase/messaging";
import {
  getReminders,
  updateReminder,
  deleteReminder,
  registerPushInstallation,
  unregisterPushInstallation,
} from "./services/reminderService";
import { getDaysLeft } from "./utils/dateUtils";
import { firebaseVapidKey, initializeMessaging } from "./firebase";
import {
  FeedbackProvider,
} from "./components/FeedbackProvider";
import { useFeedback } from "./components/FeedbackContext";
import { getUserFacingError } from "./components/feedbackUtils";
import { LoadingIndicator } from "./components/FeedbackStates";

import {
  Link,
  NavLink,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import RemindersPage from "./pages/RemindersPage";

import "./App.css";

const PUSH_REGISTRATION_SESSION_KEY = "lifevault_push_registration";

function ShellIcon({ name }) {
  const icons = {
    dashboard: (
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </>
    ),
    reminders: (
      <>
        <rect x="4" y="3.5" width="16" height="17" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    logout: (
      <>
        <path d="M10 5H5.5A1.5 1.5 0 0 0 4 6.5v11A1.5 1.5 0 0 0 5.5 19H10" />
        <path d="M14 8l4 4-4 4M8 12h10" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
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

// Reusable summary card



// Dashboard page



// Reminders page


function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { askConfirmation, showToast } = useFeedback();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const [token, setToken] = useState(
    () => localStorage.getItem("lifevault_token")
  );
  const [notificationSupported] = useState(
    () => typeof window !== "undefined" && "Notification" in window
  );
  const [notificationPermission, setNotificationPermission] = useState(() =>
    typeof window !== "undefined" && "Notification" in window
      ? window.Notification.permission
      : "unsupported"
  );
  const [messagingRegistrationStatus, setMessagingRegistrationStatus] =
    useState("not-registered");
  const messagingRegistrationAttemptRef = useRef(false);
  const fidRegistrationInFlightRef = useRef(false);

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("lifevault_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [pushRegistration, setPushRegistration] = useState(() => {
    try {
      const savedRegistration = sessionStorage.getItem(
        PUSH_REGISTRATION_SESSION_KEY
      );
      const registration = savedRegistration
        ? JSON.parse(savedRegistration)
        : null;

      return registration &&
        typeof registration.fid === "string" &&
        typeof registration.userId === "string"
        ? registration
        : null;
    } catch {
      return null;
    }
  });

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyReminderIds, setBusyReminderIds] = useState([]);
  const completionInFlightRef = useRef(new Set());
  const completedCount = reminders.filter(
    (reminder) => reminder.isCompleted
  ).length;
  const currentPageTitle =
    location.pathname === "/reminders"
      ? "Reminders"
      : location.pathname === "/"
        ? "Dashboard"
        : "Page not found";
  const userInitials = (currentUser?.name || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  async function handleLogout() {
    let savedRegistration = null;

    try {
      const savedRegistrationJson = sessionStorage.getItem(
        "lifevault_push_registration"
      );
      savedRegistration = savedRegistrationJson
        ? JSON.parse(savedRegistrationJson)
        : null;
    } catch {
      // Continue logout if session storage is unavailable or invalid.
    }

    if (token && typeof savedRegistration?.fid === "string" && savedRegistration.fid.trim()) {
      try {
        await unregisterPushInstallation(savedRegistration.fid);
      } catch {
        // Logout must continue even if server-side registration cleanup fails.
      }
    }

    setMessagingRegistrationStatus("not-registered");

    try {
      sessionStorage.removeItem(PUSH_REGISTRATION_SESSION_KEY);
    } catch {
      // Session storage may be unavailable in restricted browser contexts.
    }

    localStorage.removeItem("lifevault_token");
    localStorage.removeItem("lifevault_user");

    setToken(null);
    setCurrentUser(null);
    setPushRegistration(null);
    setReminders([]);
    setError("");

    navigate("/login", { replace: true });
  }

  async function handleEnableNotifications() {
    if (
      !token ||
      !notificationSupported ||
      notificationPermission === "denied" ||
      messagingRegistrationAttemptRef.current
    ) {
      return;
    }

    messagingRegistrationAttemptRef.current = true;
    setMessagingRegistrationStatus("registering");

    try {
      const permission =
        notificationPermission === "granted"
          ? "granted"
          : await window.Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== "granted") {
        messagingRegistrationAttemptRef.current = false;
        setMessagingRegistrationStatus("not-registered");
        return;
      }

      if (!("serviceWorker" in navigator)) {
        setMessagingRegistrationStatus("unsupported");
        messagingRegistrationAttemptRef.current = false;
        return;
      }

      const serviceWorkerRegistration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" }
      );
      const messaging = await initializeMessaging();

      if (!messaging) {
        setMessagingRegistrationStatus("unsupported");
        messagingRegistrationAttemptRef.current = false;
        return;
      }

      let unsubscribe = () => {};
      unsubscribe = onRegistered(messaging, async (fid) => {
        if (!fid || fidRegistrationInFlightRef.current) return;

        fidRegistrationInFlightRef.current = true;

        try {
          const registration = {
            fid,
            userId: String(currentUser?.id || ""),
          };
          setPushRegistration(registration);

          try {
            sessionStorage.setItem(
              PUSH_REGISTRATION_SESSION_KEY,
              JSON.stringify(registration)
            );
          } catch {
            // Keep the FID in memory when session storage is unavailable.
          }

          await registerPushInstallation(fid);
          setMessagingRegistrationStatus("registered");
          showToast("Background notifications enabled.");
        } catch {
          setMessagingRegistrationStatus("error");
          showToast("Unable to enable background notifications.", "error");
        } finally {
          fidRegistrationInFlightRef.current = false;
          messagingRegistrationAttemptRef.current = false;
          unsubscribe();
        }
      });

      try {
        await register(messaging, {
          vapidKey: firebaseVapidKey,
          serviceWorkerRegistration,
        });
      } catch (error) {
        unsubscribe();
        throw error;
      }
    } catch {
      setNotificationPermission(window.Notification.permission);
      setMessagingRegistrationStatus("error");
      messagingRegistrationAttemptRef.current = false;
      showToast("Unable to enable background notifications.", "error");
    }
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
        showToast("Unable to load reminders. Please try again.", "error");
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
  }, [token, refreshKey, showToast]);

  useEffect(() => {
    if (
      !token ||
      !currentUser?.id ||
      !notificationSupported ||
      notificationPermission !== "granted" ||
      messagingRegistrationStatus !== "registered"
    ) {
      return;
    }

    let active = true;
    let unsubscribe;

    initializeMessaging()
      .then((messaging) => {
        if (!active || !messaging) return;

        unsubscribe = onMessage(messaging, (payload) => {
          if (!active || window.Notification.permission !== "granted") return;

          const title = payload.data?.title;
          const body = payload.data?.body;
          if (typeof title !== "string" || typeof body !== "string") return;

          try {
            new window.Notification(title, { body });
          } catch {
            // Browser notification failures should not interrupt the app.
          }
        });
      })
      .catch(() => {});

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [
    token,
    currentUser?.id,
    notificationSupported,
    notificationPermission,
    messagingRegistrationStatus,
  ]);

  useEffect(() => {
    const userId = currentUser?.id;

    if (
      !token ||
      !userId ||
      !notificationSupported ||
      notificationPermission !== "granted" ||
      messagingRegistrationStatus === "registered" ||
      !Array.isArray(reminders)
    ) {
      return;
    }

    for (const reminder of reminders) {
      if (reminder.isCompleted) continue;

      const daysLeft = getDaysLeft(reminder.dueDate);
      let alertType;
      let alertLabel;

      if (daysLeft === 0) {
        alertType = "today";
        alertLabel = "due today";
      } else if (daysLeft === 1) {
        alertType = "tomorrow";
        alertLabel = "due tomorrow";
      } else if (daysLeft < 0) {
        alertType = "overdue";
        alertLabel = "overdue";
      } else {
        continue;
      }

      const fingerprint = JSON.stringify({
        userId: String(userId),
        reminderId: String(reminder._id),
        dueDate: String(reminder.dueDate).slice(0, 10),
        alertType,
      });
      const storageKey = `lifevault_notification:${fingerprint}`;

      try {
        if (window.localStorage.getItem(storageKey)) continue;

        window.localStorage.setItem(storageKey, "shown");
        new window.Notification(`LifeVault: Reminder ${alertLabel}`, {
          body: reminder.title,
        });
      } catch {
        // Storage or browser notification failures should not interrupt the app.
      }
    }
  }, [
    token,
    currentUser,
    reminders,
    notificationSupported,
    notificationPermission,
    messagingRegistrationStatus,
  ]);

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

  function handleDelete(id) {
    askConfirmation({
      title: "Delete this reminder?",
      description: "This action cannot be undone. The reminder will be permanently removed.",
      confirmLabel: "Delete reminder",
      loadingLabel: "Deleting...",
      onConfirm: async () => {
        try {
          await deleteReminder(id);
          setReminders((previousReminders) =>
            previousReminders.filter((reminder) => reminder._id !== id)
          );
          showToast("Reminder deleted successfully.");
          return true;
        } catch (err) {
          console.error("Error deleting reminder:", err);

          if (err.response?.status === 401) {
            handleLogout();
            return true;
          }

          throw new Error(
            getUserFacingError(
              err,
              "Unable to delete reminder. Please try again."
            )
          );
        }
      },
    });
  }
  const handleToggleComplete = async (reminder) => {
    if (completionInFlightRef.current.has(reminder._id)) return;
    completionInFlightRef.current.add(reminder._id);
    setBusyReminderIds((current) => [...current, reminder._id]);

    try {
      await updateReminder(
        reminder._id,
        { isCompleted: !reminder.isCompleted }
      );

      showToast(
        reminder.isCompleted
          ? "Reminder marked as pending."
          : "Reminder marked as completed."
      );

      // Fetch the latest reminders, including newly generated ones
      try {
        const latestReminders = await getReminders();
        setReminders(latestReminders);
      } catch (refreshError) {
        if (refreshError.response?.status === 401) {
          handleLogout();
          return;
        }

        const message =
          "Reminder status updated, but the list could not be refreshed.";
        showToast(message, "error");
      }
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        handleLogout();
        return;
      }

      const message = getUserFacingError(
        requestError,
        "Could not update reminder status."
      );
      showToast(message, "error");
    } finally {
      completionInFlightRef.current.delete(reminder._id);
      setBusyReminderIds((current) =>
        current.filter((id) => id !== reminder._id)
      );
    }
  };

  return (
    <div className={`app ${token ? "app-authenticated" : "app-public"}`}>
      {token ? (
        <>
          <aside
            id="primary-sidebar"
            className={`sidebar ${isMobileNavOpen ? "is-open" : ""}`}
            aria-label="Main sidebar"
          >
            <div className="sidebar-brand-row">
              <Link className="brand" to="/" aria-label="LifeVault dashboard">
                <img
                  className="sidebar-logo-full"
                  src="/images/lifevault-logo.svg"
                  alt="LifeVault — Remember. Organize. Achieve."
                />
                <img
                  className="sidebar-logo-mark"
                  src="/images/lifevault-mark.svg"
                  alt="LifeVault"
                />
              </Link>
              <button
                className="sidebar-close"
                type="button"
                aria-label="Close navigation"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <ShellIcon name="close" />
              </button>
            </div>

            <p className="sidebar-section-label">Workspace</p>
            <nav className="navbar" aria-label="Primary navigation">
              <NavLink
                to="/"
                end
                aria-label="Dashboard"
                title="Dashboard"
                onClick={() => setIsMobileNavOpen(false)}
                className={({ isActive }) =>
                  isActive ? "nav-link is-active" : "nav-link"
                }
              >
                <ShellIcon name="dashboard" />
                <span className="nav-link-label">Dashboard</span>
              </NavLink>
              <NavLink
                to="/reminders"
                aria-label="Reminders"
                title="Reminders"
                onClick={() => setIsMobileNavOpen(false)}
                className={({ isActive }) =>
                  isActive ? "nav-link is-active" : "nav-link"
                }
              >
                <ShellIcon name="reminders" />
                <span className="nav-link-label">Reminders</span>
              </NavLink>
            </nav>
          </aside>

          {isMobileNavOpen && (
            <button
              className="sidebar-backdrop"
              type="button"
              aria-label="Close navigation"
              onClick={() => setIsMobileNavOpen(false)}
            />
          )}
        </>
      ) : (
        <header className="public-header">
          <div className="public-header-inner">
            <Link className="brand" to="/" aria-label="LifeVault home">
              <span className="brand-mark" aria-hidden="true">L</span>
              <span className="brand-copy">
                <strong>LifeVault</strong>
                <small>PERSONAL ORGANIZATION</small>
              </span>
            </Link>
            <p>Never forget what needs attention.</p>
          </div>
        </header>
      )}

      <div className="app-workspace">
        {token && (
          <header className="topbar">
            <button
              className="mobile-menu-toggle"
              type="button"
              aria-label={isMobileNavOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={isMobileNavOpen}
              aria-controls="primary-sidebar"
              onClick={() => setIsMobileNavOpen((isOpen) => !isOpen)}
            >
              <ShellIcon name={isMobileNavOpen ? "close" : "menu"} />
            </button>

            <div className="topbar-title">
              <p className="breadcrumb">LifeVault <span>/</span> Workspace</p>
              <h1>{currentPageTitle}</h1>
            </div>

            <div className="profile-area">
              <div className="profile-avatar" aria-label={`${currentUser?.name || "User"} initials`}>
                {userInitials}
              </div>
              <div className="profile-copy">
                <span>Welcome{currentUser?.name ? `, ${currentUser.name}` : ""}</span>
                <small>Personal workspace</small>
              </div>
              <button
                className="logout-button"
                type="button"
                onClick={handleLogout}
              >
                <ShellIcon name="logout" />
                <span>Log out</span>
              </button>
            </div>
          </header>
        )}

        <main className={`app-main ${token ? "" : "app-main-public"}`}>
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
                <LoadingIndicator label="Loading reminders..." />
              ) : error ? (
                <div className="app-load-error" role="alert">
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
                notificationSupported={notificationSupported}
                notificationPermission={notificationPermission}
                messagingRegistrationStatus={messagingRegistrationStatus}
                onEnableNotifications={handleEnableNotifications}
                busyReminderIds={busyReminderIds}
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
                <LoadingIndicator label="Loading reminders..." />
              ) : error ? (
                <div className="app-load-error" role="alert">
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => setRefreshKey((previous) => previous + 1)}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <RemindersPage
                reminders={reminders}
                setReminders={setReminders}
                onDelete={handleDelete}
                onToggleComplete={handleToggleComplete}
                busyReminderIds={busyReminderIds}
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
    </div>
  );
}

export default function App() {
  return (
    <FeedbackProvider>
      <AppContent />
    </FeedbackProvider>
  );
}
