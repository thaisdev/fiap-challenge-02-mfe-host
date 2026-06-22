import type { NewTransactionResult, ReceiptFile } from '../_components/interfaces/new-transaction-panel.interfaces';
import type { TransactionType } from '../_components/interfaces/transaction.interfaces';

export type TransactionPayload = {
  id: number;
  type: TransactionType;
  date: string;
  value: number;
  receiptFile?: ReceiptFile | null;
};

type ServiceMessageResponse = {
  message?: unknown;
};

export type TransactionsPagination = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedTransactions = {
  data: TransactionPayload[];
  pagination: TransactionsPagination;
};

export type FinancialSummary = {
  balance: number;
  depositsTotal: number;
  transfersTotal: number;
};

function accountTransactionsUrl(userId: number) {
  return `/api/users/${userId}/account/transactions`;
}

function resolveServiceMessage(body: ServiceMessageResponse | null, fallbackMessage: string) {
  return typeof body?.message === 'string' && body.message.trim().length > 0
    ? body.message
    : fallbackMessage;
}

function isTransactionPayload(value: unknown): value is TransactionPayload {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const transaction = value as Record<string, unknown>;

  return (
    typeof transaction.id === 'number' &&
    typeof transaction.type === 'string' &&
    typeof transaction.date === 'string' &&
    typeof transaction.value === 'number'
  );
}

function isTransactionsPagination(value: unknown): value is TransactionsPagination {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const pagination = value as Record<string, unknown>;

  return (
    typeof pagination.page === 'number' &&
    typeof pagination.limit === 'number' &&
    typeof pagination.totalItems === 'number' &&
    typeof pagination.totalPages === 'number' &&
    typeof pagination.hasNextPage === 'boolean' &&
    typeof pagination.hasPreviousPage === 'boolean'
  );
}

function isPaginatedTransactions(value: unknown): value is PaginatedTransactions {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const result = value as Record<string, unknown>;

  return (
    Array.isArray(result.data) &&
    result.data.every(isTransactionPayload) &&
    isTransactionsPagination(result.pagination)
  );
}

function isFinancialSummary(value: unknown): value is FinancialSummary {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const summary = value as Record<string, unknown>;

  return (
    typeof summary.balance === 'number' &&
    typeof summary.depositsTotal === 'number' &&
    typeof summary.transfersTotal === 'number'
  );
}

async function sendTransactionRequest(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  token: string,
  payload?: TransactionPayload
): Promise<NewTransactionResult> {
  const fallbackErrorMessage = 'Não foi possível concluir a operação. Tente novamente.';

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(payload ? { 'content-type': 'application/json' } : {}),
      },
      ...(payload ? { body: JSON.stringify(payload) } : {}),
    });

    if (response.ok) {
      return { ok: true };
    }

    const body = (await response.json().catch(() => null)) as ServiceMessageResponse | null;

    return {
      ok: false,
      message: resolveServiceMessage(body, fallbackErrorMessage),
    };
  } catch {
    return {
      ok: false,
      message: 'Erro de conexão. Tente novamente em instantes.',
    };
  }
}

export async function fetchTransactions(
  userId: number,
  token: string,
  { page = 1, limit = 10 }: { page?: number; limit?: number } = {}
): Promise<{ ok: true; transactions: PaginatedTransactions } | { ok: false; message: string }> {
  const fallbackErrorMessage = 'Não foi possível carregar as transações.';
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  try {
    const response = await fetch(`${accountTransactionsUrl(userId)}?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      return {
        ok: false,
        message: resolveServiceMessage(body as ServiceMessageResponse | null, fallbackErrorMessage),
      };
    }

    if (!isPaginatedTransactions(body)) {
      return {
        ok: false,
        message: fallbackErrorMessage,
      };
    }

    return {
      ok: true,
      transactions: body,
    };
  } catch {
    return {
      ok: false,
      message: 'Erro de conexão. Tente novamente em instantes.',
    };
  }
}

export async function fetchFinancialSummary(
  userId: number,
  token: string
): Promise<{ ok: true; summary: FinancialSummary } | { ok: false; message: string }> {
  const fallbackErrorMessage = 'Não foi possível carregar o resumo financeiro.';

  try {
    const response = await fetch(`${accountTransactionsUrl(userId)}/summary`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      return {
        ok: false,
        message: resolveServiceMessage(body as ServiceMessageResponse | null, fallbackErrorMessage),
      };
    }

    if (!isFinancialSummary(body)) {
      return {
        ok: false,
        message: fallbackErrorMessage,
      };
    }

    return {
      ok: true,
      summary: body,
    };
  } catch {
    return {
      ok: false,
      message: 'Erro de conexão. Tente novamente em instantes.',
    };
  }
}

export function addTransaction(userId: number, token: string, payload: TransactionPayload) {
  return sendTransactionRequest(accountTransactionsUrl(userId), 'POST', token, payload);
}

export function updateTransaction(
  userId: number,
  token: string,
  transactionId: number,
  payload: TransactionPayload
) {
  return sendTransactionRequest(
    `${accountTransactionsUrl(userId)}/${transactionId}`,
    'PUT',
    token,
    payload
  );
}

export function deleteTransaction(userId: number, token: string, transactionId: number) {
  return sendTransactionRequest(
    `${accountTransactionsUrl(userId)}/${transactionId}`,
    'DELETE',
    token
  );
}
