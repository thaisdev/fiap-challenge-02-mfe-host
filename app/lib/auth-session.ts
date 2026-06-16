import { StatementEntryType } from '../dashboard/_components/interfaces/statement-panel.interfaces';
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

function parseCurrencyStringToNumber(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/\s/g, '')
    .replace('R$', '')
    .replace(/\./g, '')
    .replace(',', '.');
  const numericValue = Number(normalized);

  return Number.isFinite(numericValue) ? numericValue : null;
}

function parseCurrencyStringToCents(value: string): number | null {
  const numericValue = parseCurrencyStringToNumber(value);

  return numericValue === null ? null : Math.round(numericValue * 100);
}

function normalizeStatementEntry(
  value: unknown
): AuthenticatedMockUser['statementEntries'][number] | null {
  if (!isRecord(value)) {
    return null;
  }

  const amountInCents =
    typeof value.amountInCents === 'number'
      ? value.amountInCents
      : typeof value.value === 'string'
        ? parseCurrencyStringToCents(value.value)
        : null;

  if (
    typeof value.id !== 'string' ||
    typeof value.month !== 'string' ||
    typeof value.type !== 'string' ||
    typeof value.date !== 'string' ||
    amountInCents === null
  ) {
    return null;
  }

  return {
    id: value.id,
    month: value.month,
    type: value.type as StatementEntryType,
    amountInCents,
    date: value.date,
  };
}

function createFallbackStatementEntry(
  index: number
): AuthenticatedMockUser['statementEntries'][number] {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - (index * 3 + 2));

  const monthLabel = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(date);

  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date);

  const isTransfer = index % 2 === 1;

  return {
    id: `fallback-session-entry-${index}-${dateLabel.replace(/\//g, '-')}`,
    month: `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}`,
    type: isTransfer ? StatementEntryType.TRANSFER : StatementEntryType.DEPOSIT,
    amountInCents: isTransfer ? -(3500 + index * 300) : 6500 + index * 500,
    date: dateLabel,
  };
}

function ensureMinimumStatementEntries(
  entries: AuthenticatedMockUser['statementEntries'],
  minimumEntries: number = 8
) {
  if (entries.length >= minimumEntries) {
    return entries;
  }

  const missingEntriesCount = minimumEntries - entries.length;
  const fallbackEntries = Array.from({ length: missingEntriesCount }, (_, index) =>
    createFallbackStatementEntry(index)
  );

  return [...entries, ...fallbackEntries];
}

export function normalizeAuthSession(value: unknown): AuthSession | null {
  if (!isRecord(value) || typeof value.token !== 'string' || !isRecord(value.user)) {
    return null;
  }

  const accountBalance =
    typeof value.user.accountBalance === 'number'
      ? value.user.accountBalance
      : typeof value.user.accountBalance === 'string'
        ? parseCurrencyStringToNumber(value.user.accountBalance)
        : null;

  const rawEntries = Array.isArray(value.user.statementEntries) ? value.user.statementEntries : [];
  const normalizedEntries = rawEntries
    .map(normalizeStatementEntry)
    .filter((entry): entry is AuthenticatedMockUser['statementEntries'][number] => entry !== null);
  const statementEntries = ensureMinimumStatementEntries(normalizedEntries);

  if (
    typeof value.user.id !== 'string' ||
    typeof value.user.name !== 'string' ||
    typeof value.user.email !== 'string' ||
    typeof value.user.createdAt !== 'string' ||
    accountBalance === null
  ) {
    return null;
  }

  return {
    token: value.token,
    user: {
      id: value.user.id,
      name: value.user.name,
      email: value.user.email,
      createdAt: value.user.createdAt,
      accountBalance,
      statementEntries,
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
