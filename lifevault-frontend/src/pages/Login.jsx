import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/reminderService";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      localStorage.setItem("lifevault_token", data.token);
      localStorage.setItem("lifevault_user", JSON.stringify(data.user));

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to log in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <form className="reminder-form" onSubmit={handleSubmit}>
        <h2>Welcome Back</h2>
        <p>Log in to access your LifeVault reminders.</p>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}
