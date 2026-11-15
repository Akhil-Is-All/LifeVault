import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/reminderService";
import AuthLayout, { AuthFieldIcon } from "../components/AuthLayout";
import { useFeedback } from "../components/FeedbackContext";
import { getUserFacingError } from "../components/feedbackUtils";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submissionInFlightRef = useRef(false);

  const navigate = useNavigate();
  const { showToast } = useFeedback();

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionInFlightRef.current) return;
    submissionInFlightRef.current = true;
    setError("");
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      localStorage.setItem("lifevault_token", data.token);
      localStorage.setItem("lifevault_user", JSON.stringify(data.user));
      showToast("Login successful.");

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(getUserFacingError(
        err,
        "Unable to log in. Please try again."
      ));
    } finally {
      submissionInFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form-content">
        <p className="auth-form-eyebrow">WELCOME BACK</p>
        <h2>Good to see you again.</h2>
        <p className="auth-form-description">
          Sign in to pick up right where you left off.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <AuthFieldIcon name="mail" />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <AuthFieldIcon name="lock" />
              </span>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                type="button"
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.4 0 9 5.5 9 7a8.8 8.8 0 0 1-2.2 3.2M6.2 6.2C4.2 7.6 3 10.2 3 12c0 1.5 3.6 7 9 7 1.2 0 2.3-.3 3.3-.8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7Z" />
                    <circle cx="12" cy="12" r="2.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="auth-error" role="alert">
              <span aria-hidden="true">!</span>
              {error}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          New to LifeVault? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
