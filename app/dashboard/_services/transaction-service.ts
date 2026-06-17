import type { NewTransactionResult } from '../_components/interfaces/new-transaction-panel.interfaces';
import type { TransactionType } from '../_components/interfaces/transaction.interfaces';

export type TransactionPayload = {
  id: number;
  type: TransactionType;
  date: string;
  value: number;
};

type ServiceMessageResponse = {
  message?: unknown;
};

function accountTransactionsUrl(userId: number) {
  return `/api/users/${userId}/account/transactions`;
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
      message:
        typeof body?.message === 'string' && body.message.trim().length > 0
          ? body.message
          : fallbackErrorMessage,
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
  return sendTransactionRequest(`${accountTransactionsUrl(userId)}/${transactionId}`, 'DELETE', token);
}
