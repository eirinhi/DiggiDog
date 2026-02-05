import { useState } from "react";
import "./App.css";


export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  function handleLogin(e) {
    e.preventDefault();

    // only check empty
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both Email and Password.");
      return;
    }

    setError("");
    setLoggedIn(true); // gå til neste side 
  }

  // tom side etter man logger inn
  if (loggedIn) {
    return (
      <div >
        <p>You are logged in.</p>
      </div>
    );
  }

  
  return (
    
    <div className="page" >
        <div className="card">
        <h1 className="title">DiggiDog</h1>

        <form onSubmit={handleLogin}>
          <div>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", marginBottom: 8 }}
          />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: "block", marginBottom: 8 }}
            />
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}
          <div className="actions">
            <button className="btn btn-primary"  type="submit">Login</button>
            <button className="btn" type="button" style={{ marginLeft: 8 }}>Sign up</button>
          </div>
        </form>
      </div>
    </div>
  );
}
