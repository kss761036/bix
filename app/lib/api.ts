"use client";

const AUTH_BASE_URL = "/api/auth";
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

function readToken(key: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

function writeToken(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function refreshAccessToken() {
  const refreshToken = readToken(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  const refreshResponse = await fetch(`${AUTH_BASE_URL}/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!refreshResponse.ok) return null;

  const refreshPayload = await parseJsonSafe(refreshResponse);
  const newAccessToken = refreshPayload?.accessToken;
  const newRefreshToken = refreshPayload?.refreshToken;
  if (!newAccessToken) return null;

  writeToken(ACCESS_TOKEN_KEY, newAccessToken);
  if (newRefreshToken) {
    writeToken(REFRESH_TOKEN_KEY, newRefreshToken);
  }
  if (typeof window !== "undefined") {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    window.localStorage.setItem("lastRefreshAt", `${hh}:${mm}:${ss}`);
  }
  return newAccessToken as string;
}

function isAuthEndpoint(input: RequestInfo | URL) {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  return url.includes("/auth/");
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  if (isAuthEndpoint(input)) {
    return fetch(input, init);
  }

  const headers = new Headers(init.headers);
  const accessToken = readToken(ACCESS_TOKEN_KEY);
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(input, { ...init, headers });
  if (response.status !== 401) return response;

  const newAccessToken = await refreshAccessToken();
  if (!newAccessToken) return response;
  headers.set("Authorization", `Bearer ${newAccessToken}`);

  return fetch(input, { ...init, headers });
}
