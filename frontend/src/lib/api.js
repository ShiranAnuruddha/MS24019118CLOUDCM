import { getAuthContext } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export async function api(path, options = {}) {
  const auth = await getAuthContext();
  const headers = new Headers(options.headers || {});

  if (auth.token) {
    headers.set("Authorization", `Bearer ${auth.token}`);
  }

  const isForm = options.body instanceof FormData;
  if (!isForm && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  console.log("API request:", {
    url: `${API_BASE_URL}${path}`,
    method: options.method || "GET",
    auth,
  });

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();

  console.log("API response:", {
    url: `${API_BASE_URL}${path}`,
    status: response.status,
    body: text,
  });

  if (!response.ok) {
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? JSON.parse(text) : text;
}

export function getSocketUrl() {
  return API_BASE_URL.replace(/\/$/, "");
}

export function getSocketPath() {
  return "/live/socket.io";
}