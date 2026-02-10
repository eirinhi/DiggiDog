import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000/api";

export default function App() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  // husk innlogging (demo) ved refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setLoggedIn(true);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please fill in both Username and Password.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Login failed");
        return;
      }

      // DEMO: lagrer bare user
      localStorage.setItem("user", JSON.stringify(data.user));

      setLoggedIn(true);
    } catch (err) {
      setError("Could not reach server. Is Django running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please fill in both Username and Password.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Signup failed");
        return;
      }

      // Etter signup: gå tilbake til login
      setMode("login");
      setPassword("");
      setMessage("User created! Please log in.");
    } catch (err) {
      setError("Could not reach server. Is Django running?");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("user");
    setLoggedIn(false);
    setUsername("");
    setPassword("");
    setMode("login");
    setError("");
    setMessage("");
  }

  if (loggedIn) {
    const user = JSON.parse(localStorage.getItem("user") || "null");

    return (
      <div className="page">
        <div className="card">
          <h1 className="title">DiggiDog</h1>
          <p>You are logged in{user?.username ? ` as ${user.username}` : ""}.</p>
          <button className="btn btn-primary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <h1 className="title">DiggiDog</h1>
        <p style={{ marginTop: 0 }}>{mode === "login" ? "Login" : "Create account"}</p>

        <form onSubmit={mode === "login" ? handleLogin : handleSignup}>
          <div>
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ display: "block", marginBottom: 8 }}
              autoComplete="username"
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: "block", marginBottom: 8 }}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}
          {message && <p style={{ color: "green" }}>{message}</p>}

          <div className="actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Sign up"}
            </button>

            <button
              className="btn"
              type="button"
              style={{ marginLeft: 8 }}
              onClick={() => {
                setError("");
                setMessage("");
                setMode(mode === "login" ? "signup" : "login");
              }}
            >
              {mode === "login" ? "Sign up" : "Back to login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
