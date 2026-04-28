import { useState } from "react";
import { saveMockUser } from "../lib/auth";

export default function MockAuth({ onAuthenticated }) {
  const [form, setForm] = useState({
    id: "cand-1",
    email: "candidate@hiresphere.local",
    name: "Candidate Demo",
    role: "candidate",
  });

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveMockUser(form);
    onAuthenticated(form);
  }

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h1>HireSphere</h1>
        <p>Mock local sign-in for development. Switch to Amplify/Cognito by adding the Vite auth variables.</p>
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            User ID
            <input value={form.id} onChange={(e) => update("id", e.target.value)} />
          </label>
          <label>
            Name
            <input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(e) => update("email", e.target.value)} />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(e) => update("role", e.target.value)}>
              <option value="candidate">Candidate</option>
              <option value="interviewer">Interviewer</option>
            </select>
          </label>
          <button type="submit">Continue</button>
        </form>
      </div>
    </div>
  );
}
