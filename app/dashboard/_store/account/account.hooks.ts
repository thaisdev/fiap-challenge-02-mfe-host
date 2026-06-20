'use client';

import { useCallback } from 'react';
import { useAuthSessionContext } from '@/app/context/auth-session-context';
import type {
  NewTransactionPayload,
  NewTransactionResult,
} from '../../_components/interfaces/new-transaction-panel.interfaces';
import type { EditTransactionPayload } from '../../_components/interfaces/statement-panel.interfaces';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  selectAccountBalance,
  selectAccountRequest,
  selectAccountTransactions,
} from './account.selectors';
import {
  deleteAccountTransaction,
  editAccountTransaction,
  loadAccount,
  submitTransaction,
} from './account.thunks';

const UNAUTHENTICATED_RESULT: NewTransactionResult = {
  ok: false,
  message: 'Sessao expirada. Faca login novamente.',
};

export function useAccount() {
  return {
    balance: useAppSelector(selectAccountBalance),
    transactions: useAppSelector(selectAccountTransactions),
    request: useAppSelector(selectAccountRequest),
  };
}

export function useAccountActions() {
  const dispatch = useAppDispatch();
  const { session } = useAuthSessionContext();
  const userId = session?.user.id;
  const token = session?.token;

  const reloadAccount = useCallback(() => {
    if (!userId || !token) {
      return Promise.resolve();
    }

    return dispatch(loadAccount({ userId, token }));
  }, [dispatch, token, userId]);

  const onSubmitTransaction = useCallback(
    (payload: NewTransactionPayload) => {
      if (!userId || !token) {
        return Promise.resolve(UNAUTHENTICATED_RESULT);
      }

      return dispatch(
        submitTransaction({
          userId,
          token,
          payload,
        })
      );
    },
    [dispatch, token, userId]
  );

  const onDeleteTransaction = useCallback(
    (transactionId: number) => {
      if (!userId || !token) {
        return Promise.resolve(UNAUTHENTICATED_RESULT);
      }

      return dispatch(
        deleteAccountTransaction({
          userId,
          token,
          transactionId,
        })
      );
    },
    [dispatch, token, userId]
  );

  const onEditTransaction = useCallback(
    (payload: EditTransactionPayload) => {
      if (!userId || !token) {
        return Promise.resolve(UNAUTHENTICATED_RESULT);
      }

      return dispatch(
        editAccountTransaction({
          userId,
          token,
          payload,
        })
      );
    },
    [dispatch, token, userId]
  );

  return {
    reloadAccount,
    onSubmitTransaction,
    onDeleteTransaction,
    onEditTransaction,
  };
}
