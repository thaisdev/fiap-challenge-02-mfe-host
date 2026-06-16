import type { AuthenticatedMockUser } from '../home/_services/auth-service';

export const AUTH_SESSION_STORAGE_KEY = 'mcintosh-bank:auth-session';
export const AUTH_SESSION_CHANGED_EVENT = 'mcintosh-bank:auth-session-changed';

export type AuthSession = {
  token: string;
  user: AuthenticatedMockUser;
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return !!value && typeof value === 'object';
}

export function normalizeAuthSession(value: unknown): AuthSession | null {
  if (!isRecord(value) || typeof value.token !== 'string' || !isRecord(value.user)) {
    return null;
  }

  if (
    typeof value.user.id !== 'number' ||
    typeof value.user.name !== 'string' ||
    typeof value.user.email !== 'string'
  ) {
    return null;
  }

  return {
    token: value.token,
    user: {
      id: value.user.id,
      name: value.user.name,
      email: value.user.email,
    },
  };
}

export function parseAuthSession(serializedSession: string | null): AuthSession | null {
  if (!serializedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(serializedSession) as unknown;
    return normalizeAuthSession(parsed);
  } catch {
    return null;
  }
}

function dispatchAuthSessionChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function setAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  dispatchAuthSessionChange();
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  dispatchAuthSessionChange();
}
