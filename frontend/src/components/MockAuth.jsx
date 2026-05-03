import { useState } from "react";
import { saveMockUser } from "../lib/auth";

const INTERVIEWER_DEMO = {
  id: "int1",
  email: "interviewer@hiresphere.local",
  name: "Shiran Fernando",
  role: "interviewer",
};

const CANDIDATE_DEMO = {
  id: "cand1",
  email: "candidate@hiresphere.local",
  name: "Anuruddha Fernando",
  role: "candidate",
};

export default function MockAuth({ onAuthenticated }) {
  const [form, setForm] = useState(INTERVIEWER_DEMO);

  function update(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function loginAs(user) {
    setForm(user);
    saveMockUser(user);
    onAuthenticated(user);
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
        <p>Mock local sign-in for development.</p>

        <div className="button-row" style={{ marginBottom: "1rem" }}>
          <button type="button" onClick={() => loginAs(INTERVIEWER_DEMO)}>
            Login as Interviewer Demo
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => loginAs(CANDIDATE_DEMO)}
          >
            Login as Candidate Demo
          </button>
        </div>

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