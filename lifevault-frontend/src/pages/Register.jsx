import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/reminderService";
import AuthLayout, { AuthFieldIcon } from "../components/AuthLayout";
import { useFeedback } from "../components/FeedbackContext";
import { getUserFacingError } from "../components/feedbackUtils";

function VisibilityIcon({ visible }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.4 0 9 5.5 9 7a8.8 8.8 0 0 1-2.2 3.2M6.2 6.2C4.2 7.6 3 10.2 3 12c0 1.5 3.6 7 9 7 1.2 0 2.3-.3 3.3-.8" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export default function Register({ onRegistrationSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submissionInFlightRef = useRef(false);

  const navigate = useNavigate();
  const { showToast } = useFeedback();

  async function handleSubmit(event) {
    event.preventDefault();
    if (submissionInFlightRef.current) return;
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match. Please check and try again.");
      return;
    }

    submissionInFlightRef.current = true;
    setLoading(true);

    try {
      const data = await registerUser({ name, email, password });

      localStorage.setItem("lifevault_token", data.token);
      localStorage.setItem("lifevault_user", JSON.stringify(data.user));
      showToast("Account created successfully.");

      if (onRegistrationSuccess) {
        onRegistrationSuccess(data.user);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        getUserFacingError(err, "Unable to register. Please try again.")
      );
    } finally {
      submissionInFlightRef.current = false;
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form-content auth-form-content-register">
        <p className="auth-form-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
        <h2>Create a little more room for life.</h2>
        <p className="auth-form-description">
          Set up your account and bring your plans together.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="name">Full name</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <AuthFieldIcon name="user" />
              </span>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
          </div>

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
                autoComplete="new-password"
                minLength={8}
                placeholder="At least 8 characters"
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
                <VisibilityIcon visible={showPassword} />
              </button>
            </div>
            <span className="auth-field-hint">
              Use at least 8 characters for your password.
            </span>
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <AuthFieldIcon name="lock" />
              </span>
              <input
                id="confirmPassword"
                type={showConfirmation ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Enter your password again"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              <button
                aria-label={
                  showConfirmation
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
                aria-pressed={showConfirmation}
                className="auth-password-toggle"
                onClick={() => setShowConfirmation((visible) => !visible)}
                type="button"
              >
                <VisibilityIcon visible={showConfirmation} />
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
                Creating your account...
              </>
            ) : (
              <>
                Create account
                <span aria-hidden="true">→</span>
              </>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
