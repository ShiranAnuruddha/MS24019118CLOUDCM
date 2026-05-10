import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import { amplifyEnabled } from "./amplify";

function buildFriendlyName(idClaims, currentUser) {
  const fullName = (idClaims.name || "").trim();
  const firstLast = `${idClaims.given_name || ""} ${idClaims.family_name || ""}`.trim();
  const emailPrefix = idClaims.email ? idClaims.email.split("@")[0] : "";

  return (
    fullName ||
    firstLast ||
    emailPrefix ||
    currentUser.username ||
    currentUser.userId ||
    "User"
  );
}

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

    let role = "candidate";
    if (groups.includes("interviewer")) {
      role = "interviewer";
    } else if (groups.includes("candidate")) {
      role = "candidate";
    }

    return {
      mode: "amplify",
      token: accessToken,
      user: {
        id: currentUser.userId,
        name: buildFriendlyName(idClaims, currentUser),
        email: idClaims.email || "",
        role,
        groups,
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
  if (amplifyEnabled) {
    await signOut();
  }
}