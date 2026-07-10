// ─── Client-side Auth Utilities ───────────────────────────────────────────────
// Token storage, authenticated fetch wrapper, role helpers.
// ──────────────────────────────────────────────────────────────────────────────

const TOKEN_KEY = "crm_token";
const USER_KEY  = "crm_user";

export interface AuthUser {
  userId:     string;
  email:      string;
  name:       string;
  role:       "ADMIN" | "STAFF";
  employeeId: string | null;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getToken() && !!getStoredUser();
}

// ─── Authenticated fetch ──────────────────────────────────────────────────────
// Drop-in replacement for fetch() that injects the JWT header.
// On 401: clears auth and dispatches a custom event so the React
// AuthContext can handle navigation — avoids hard page reload mid-request.

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();

  const headers: Record<string, string> = {
    // Only set Content-Type for requests with a body — avoids preflight issues
    ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (networkErr) {
    // Network failure or aborted request — don't treat as auth failure
    throw networkErr;
  }

  if (res.status === 401) {
    clearAuth();
    // Dispatch event so AuthContext can react and redirect via React Router
    // instead of a hard window.location change which aborts in-flight requests
    window.dispatchEvent(new CustomEvent("crm:unauthorized"));
  }

  return res;
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}

export function isStaff(user: AuthUser | null): boolean {
  return user?.role === "STAFF";
}
