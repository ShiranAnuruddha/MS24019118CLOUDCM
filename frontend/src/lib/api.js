import { getAuthContext } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function api(path, options = {}) {
  const auth = await getAuthContext();
  const headers = new Headers(options.headers || {});

  if (auth.mode === "amplify" && auth.token) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }

  if (auth.mode === "mock" && auth.user) {
    if (auth.user.id) headers.set("x-mock-user-id", auth.user.id);
    if (auth.user.email) headers.set("x-mock-user-email", auth.user.email);
    if (auth.user.role) headers.set("x-mock-user-role", auth.user.role);
    if (auth.user.name) headers.set("x-mock-user-name", auth.user.name);
  }

  const isForm = options.body instanceof FormData;
  if (!isForm && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  console.log("API request:", path, {
    method: options.method || "GET",
    auth,
  });

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export function getSocketUrl() {
  return API_BASE_URL.replace(/\/$/, "");
}

export function getSocketPath() {
  return "/live/socket.io";
}