const TOKEN_KEY = "dc_auth_token";

let authRequired = false;
const authListeners = new Set<(required: boolean) => void>();

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function notifyAuthListeners(): void {
  for (const listener of authListeners) listener(authRequired);
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

export function getToken(): string | null {
  if (!canUseStorage()) return null;
  const value = window.localStorage.getItem(TOKEN_KEY)?.trim() ?? "";
  return value === "" ? null : value;
}

export function setToken(token: string): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token === null ? {} : { Authorization: `Bearer ${token}` };
}

export function withAuthToken(url: string): string {
  const token = getToken();
  if (token === null) return url;
  if (typeof window === "undefined") {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}token=${encodeURIComponent(token)}`;
  }
  const absolute = new URL(url, window.location.origin);
  absolute.searchParams.set("token", token);
  if (url.startsWith("http://") || url.startsWith("https://")) return absolute.toString();
  return `${absolute.pathname}${absolute.search}${absolute.hash}`;
}

export function isAuthRequired(): boolean {
  return authRequired;
}

export function requireLogin(): void {
  clearToken();
  if (authRequired) return;
  authRequired = true;
  notifyAuthListeners();
}

export function clearLoginRequirement(): void {
  if (!authRequired) return;
  authRequired = false;
  notifyAuthListeners();
}

export function subscribeAuthRequired(listener: (required: boolean) => void): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

export async function login(email: string, password: string): Promise<void> {
  const { apiBase } = await import("./index");
  const res = await fetch(`${apiBase()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 401) throw new InvalidCredentialsError();
  if (!res.ok) throw new Error(`request failed: ${res.status}`);
  const payload = (await res.json()) as { token?: unknown } | null;
  if (typeof payload?.token !== "string" || payload.token.trim() === "") {
    throw new Error("login response carried no token");
  }
  setToken(payload.token);
  clearLoginRequirement();
}
