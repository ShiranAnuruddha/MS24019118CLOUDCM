import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";
import { amplifyEnabled } from "./amplify";

const STORAGE_KEY = "hiresphere_mock_user";

export function getMockUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveMockUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearMockUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function getAuthContext() {
  if (amplifyEnabled) {
    const session = await fetchAuthSession();
    const authUser = await getCurrentUser();
    return {
      mode: "amplify",
      token: session.tokens?.accessToken?.toString() || "",
      user: {
        id: authUser.userId,
        email: authUser.signInDetails?.loginId || authUser.username,
        name: authUser.signInDetails?.loginId || authUser.username,
        role: "candidate",
      },
    };
  }

  const mockUser = getMockUser();
  if (!mockUser) return { mode: "mock", token: "", user: null };
  return { mode: "mock", token: "", user: mockUser };
}

export async function logout() {
  if (amplifyEnabled) {
    await signOut();
  } else {
    clearMockUser();
  }
}
