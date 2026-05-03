const MOCK_USER_KEY = "hiresphere_mock_user";

export function getMockUser() {
  try {
    const raw = localStorage.getItem(MOCK_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveMockUser(user) {
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
}

export async function getAuthContext() {
  const mockUser = getMockUser();

  if (mockUser) {
    return {
      mode: "mock",
      user: mockUser,
      token: null,
    };
  }

  return {
    mode: "mock",
    user: null,
    token: null,
  };
}

export async function logout() {
  localStorage.removeItem(MOCK_USER_KEY);
}