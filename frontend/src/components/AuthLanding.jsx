import { useNavigate } from "react-router-dom";

export default function AuthLanding() {
  const navigate = useNavigate();

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h1>HireSphere</h1>
        <p>Select how you want to sign in</p>

        <div className="form-grid">
          <button type="button" onClick={() => navigate("/login/interviewer")}>
            Login as Interviewer
          </button>

          <button type="button" onClick={() => navigate("/login/candidate")}>
            Login as Candidate
          </button>
        </div>
      </div>
    </div>
  );
}