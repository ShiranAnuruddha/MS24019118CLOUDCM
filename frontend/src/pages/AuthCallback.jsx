import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getSelectedLoginRole } from "../lib/loginRole";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const role = getSelectedLoginRole() || "candidate";
    navigate(`/${role}/dashboard`, { replace: true });
  }, [navigate]);

  return <div style={{ padding: 24 }}>Signing you in...</div>;
}