import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";

function RedirectAfterLogin({ role }) {
  const navigate = useNavigate();
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  useEffect(() => {
    if (authStatus === "authenticated") {
      navigate(`/${role}/dashboard`, { replace: true });
    }
  }, [authStatus, navigate, role]);

  return null;
}

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
          <RedirectAfterLogin role={role} />
        </Authenticator>
      </div>
    </div>
  );
}