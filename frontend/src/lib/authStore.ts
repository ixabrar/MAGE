"use client";

export type StoredUser = { id: string; email: string; full_name: string; role: string };

const ACCESS_KEY = "mage_access_token";
const REFRESH_KEY = "mage_refresh_token";
const USER_KEY = "mage_user";

export function saveAuth(access_token: string, refresh_token: string, user: StoredUser) {
  localStorage.setItem(ACCESS_KEY, access_token);
  localStorage.setItem(REFRESH_KEY, refresh_token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function clearAuth() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getRole(): string | null {
  return getStoredUser()?.role ?? null;
}

export function isDoctor(): boolean {
  const r = getRole();
  return r === "doctor" || r === "clinician";
}

export function isAdmin(): boolean {
  const r = getRole();
  return r === "system_admin" || r === "admin" || r === "organization_admin";
}
