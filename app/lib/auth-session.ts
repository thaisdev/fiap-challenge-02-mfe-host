import { TransactionType } from '../dashboard/_components/interfaces/transaction.interfaces';
import type { AuthenticatedMockUser, AuthTransaction } from '../home/_services/auth-service';

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

function normalizeTransactionType(value: unknown): TransactionType | null {
  return value === TransactionType.DEPOSIT || value === TransactionType.TRANSFER
    ? value
    : null;
}

function normalizeTransaction(value: unknown): AuthTransaction | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = normalizeTransactionType(value.type);

  if (
    typeof value.id !== 'number' ||
    type === null ||
    typeof value.date !== 'string' ||
    typeof value.value !== 'number'
  ) {
    return null;
  }

  return {
    id: value.id,
    type,
    date: value.date,
    value: value.value,
  };
}

function createFallbackTransaction(index: number): AuthTransaction {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - (index * 3 + 2));

  const isTransfer = index % 2 === 1;

  return {
    id: Date.now() + index,
    type: isTransfer ? TransactionType.TRANSFER : TransactionType.DEPOSIT,
    date: date.toISOString(),
    value: isTransfer ? 35 + index * 3 : 65 + index * 5,
  };
}

function ensureMinimumTransactions(
  transactions: AuthTransaction[],
  minimumTransactions: number = 8
) {
  if (transactions.length >= minimumTransactions) {
    return transactions;
  }

  const missingTransactionsCount = minimumTransactions - transactions.length;
  const fallbackTransactions = Array.from({ length: missingTransactionsCount }, (_, index) =>
    createFallbackTransaction(index)
  );

  return [...transactions, ...fallbackTransactions];
}

export function normalizeAuthSession(value: unknown): AuthSession | null {
  if (!isRecord(value) || typeof value.token !== 'string' || !isRecord(value.user)) {
    return null;
  }

  if (
    typeof value.user.id !== 'number' ||
    typeof value.user.name !== 'string' ||
    typeof value.user.email !== 'string' ||
    !isRecord(value.user.account) ||
    typeof value.user.account.balance !== 'number'
  ) {
    return null;
  }

  const rawTransactions = Array.isArray(value.user.account.transactions)
    ? value.user.account.transactions
    : [];
  const normalizedTransactions = rawTransactions
    .map(normalizeTransaction)
    .filter((transaction): transaction is AuthTransaction => transaction !== null);
  const transactions = ensureMinimumTransactions(normalizedTransactions);

  return {
    token: value.token,
    user: {
      id: value.user.id,
      name: value.user.name,
      email: value.user.email,
      account: {
        balance: value.user.account.balance,
        transactions,
      },
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
