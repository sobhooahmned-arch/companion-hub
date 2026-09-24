export type StoredUser = {
  identifier: string;
  method: "email" | "phone";
  name: string;
  createdAt: string;
  isAdmin?: boolean;
};

const KEY = "wafr_user";

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: StoredUser) {
  window.localStorage.setItem(KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  window.localStorage.removeItem(KEY);
}

export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const phonePattern = /^[0-9]{11}$/;

const LAST_KEY = "wafr_last_login";
export type LastLogin = { identifier: string; method: "email" | "phone"; name: string; password?: string };

export function getLastLogin(): LastLogin | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as LastLogin) : null;
  } catch {
    return null;
  }
}

export function saveLastLogin(v: LastLogin) {
  window.localStorage.setItem(LAST_KEY, JSON.stringify(v));
}
