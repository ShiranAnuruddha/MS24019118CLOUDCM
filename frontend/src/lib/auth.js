import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import { amplifyEnabled } from "./amplify";
import { getSelectedLoginRole, clearSelectedLoginRole } from "./loginRole";

export async function getAuthContext() {
  if (!amplifyEnabled) {
    return {
      mode: "none",
      user: null,
      token: null,
    };
  }

  try {
    const [session, currentUser] = await Promise.all([
      fetchAuthSession(),
      getCurrentUser(),
    ]);

    const accessToken = session.tokens?.accessToken?.toString() || null;
    const idClaims = session.tokens?.idToken?.payload || {};
    const groups = idClaims["cognito:groups"] || [];

    const groupRole = groups.includes("interviewer")
      ? "interviewer"
      : groups.includes("candidate")
      ? "candidate"
      : null;

    const selectedRole = getSelectedLoginRole() || "candidate";

    return {
      mode: "amplify",
      token: accessToken,
      user: {
        id: currentUser.userId,
        name: idClaims.name || idClaims.email || currentUser.username || "User",
        email: idClaims.email || "",
        role: groupRole || selectedRole,
      },
    };
  } catch {
    return {
      mode: "amplify",
      user: null,
      token: null,
    };
  }
}

export async function logout() {
  clearSelectedLoginRole();

  if (amplifyEnabled) {
    await signOut();
  }
}