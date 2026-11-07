import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/reminderService";

export default function Register({ onRegistrationSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser({ name, email, password });

      localStorage.setItem("lifevault_token", data.token);
      localStorage.setItem("lifevault_user", JSON.stringify(data.user));

      if (onRegistrationSuccess) {
        onRegistrationSuccess(data.user);
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to register. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <form className="reminder-form" onSubmit={handleSubmit}>
        <h2>Create Your Account</h2>
        <p>Start managing your life reminders with LifeVault.</p>

        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

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
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
