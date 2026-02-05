"use client";

import axios, { type AxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://front-mission.bigs.or.kr";
const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
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

function getUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function toResponseFromAxios(
  status: number,
  data: unknown,
  headers: Record<string, string>,
) {
  const text =
    typeof data === "string"
      ? data
      : data == null
        ? ""
        : JSON.stringify(data);
  return new Response(text, { status, headers });
}

async function axiosRequest(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = Object.fromEntries(new Headers(init.headers).entries());
  const config: AxiosRequestConfig = {
    url: getUrl(input),
    method: (init.method ?? "GET") as AxiosRequestConfig["method"],
    headers,
    data: init.body,
    withCredentials: false,
    responseType: "text",
    transformResponse: [(v) => v],
    validateStatus: () => true,
  };

  const res = await axios.request(config);
  const responseHeaders: Record<string, string> = {};
  Object.entries(res.headers ?? {}).forEach(([k, v]) => {
    if (Array.isArray(v)) responseHeaders[k] = v.join(", ");
    else if (typeof v === "string") responseHeaders[k] = v;
  });

  return toResponseFromAxios(res.status, res.data, responseHeaders);
}

export async function refreshAccessToken() {
  const refreshToken = readToken(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  const refreshResponse = await axiosRequest(`${AUTH_BASE_URL}/refresh`, {
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
  const url = getUrl(input);
  return url.includes("/auth/");
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  if (isAuthEndpoint(input)) {
    return axiosRequest(input, init);
  }

  const headers = new Headers(init.headers);
  const accessToken = readToken(ACCESS_TOKEN_KEY);
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await axiosRequest(input, { ...init, headers });
  if (response.status !== 401) return response;

  const newAccessToken = await refreshAccessToken();
  if (!newAccessToken) return response;
  headers.set("Authorization", `Bearer ${newAccessToken}`);

  return axiosRequest(input, { ...init, headers });
}
