import { Authenticator } from "@aws-amplify/ui-react";
import { useNavigate } from "react-router-dom";

export default function AuthLoginPage({ role }) {
  const navigate = useNavigate();

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h1>HireSphere</h1>
        <p>
          Sign in as <strong>{role}</strong>
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <button type="button" onClick={() => navigate("/login")}>
            Back
          </button>
        </div>

        <Authenticator loginMechanisms={["email"]} signUpAttributes={["name"]}>
          {({ user }) => {
            if (user) {
              navigate(`/${role}/dashboard`, { replace: true });
            }
            return null;
          }}
        </Authenticator>
      </div>
    </div>
  );
}