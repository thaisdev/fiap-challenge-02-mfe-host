'use client';

import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';
import type { AuthSession } from '@/app/lib/auth-session';
import { fetchAccountByUserId } from '@/app/home/_services/auth-service';
import type {
  NewTransactionPayload,
  NewTransactionResult,
} from '../_components/interfaces/new-transaction-panel.interfaces';
import type {
  EditTransactionPayload,
  Transaction,
} from '../_components/interfaces/statement-panel.interfaces';
import { TransactionType } from '../_components/interfaces/statement-panel.interfaces';
import { AccountActionType, accountReducer, createAccountState } from './account.reducer';
import {
  formatIsoDateToPtBr,
  getTransactionDateRange,
  toTransactionIsoDate,
} from '../_utils/transaction-date';

export type AccountStatus = 'loading' | 'ready' | 'error';

type AccountContextValue = {
  status: AccountStatus;
  errorMessage: string | null;
  balance: number;
  transactions: Transaction[];
  onSubmitTransaction: (payload: NewTransactionPayload) => NewTransactionResult;
  onDeleteTransaction: (transactionId: number) => void;
  onEditTransaction: (payload: EditTransactionPayload) => NewTransactionResult;
};

const AccountContext = createContext<AccountContextValue | null>(null);

function createMockTransactionId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function createTransaction(
  { type, value }: Omit<NewTransactionPayload, 'transactionDate'>,
  isoDate: string
): Transaction {
  return {
    id: createMockTransactionId(),
    type,
    value: Math.abs(value),
    date: isoDate,
  };
}

type AccountProviderProps = {
  session: AuthSession;
  children: ReactNode;
};

export function AccountProvider({ session, children }: AccountProviderProps) {
  const [accountState, dispatchAccountAction] = useReducer(
    accountReducer,
    createAccountState(0, [])
  );
  const [status, setStatus] = useState<AccountStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const transactionDateRange = getTransactionDateRange();
  const userId = session.user.id;
  const { token } = session;

  useEffect(() => {
    let isCurrent = true;

    fetchAccountByUserId(userId, token).then((result) => {
      if (!isCurrent) {
        return;
      }

      if (result.ok) {
        dispatchAccountAction({
          type: AccountActionType.HYDRATE_FROM_PROPS,
          balance: result.account.balance,
          transactions: result.account.transactions,
        });
        setErrorMessage(null);
        setStatus('ready');
        return;
      }

      setErrorMessage(result.message);
      setStatus('error');
    });

    return () => {
      isCurrent = false;
    };
  }, [userId, token]);

  const onSubmitTransaction = ({
    type,
    value,
    transactionDate,
  }: NewTransactionPayload): NewTransactionResult => {
    if (type === TransactionType.TRANSFER && value > accountState.balance) {
      return {
        ok: false,
        message: 'Saldo insuficiente para concluir a transferência.',
      };
    }

    const isoDate = toTransactionIsoDate(transactionDate, transactionDateRange);
    if (!isoDate) {
      return {
        ok: false,
        message: `Data inválida. Selecione uma data entre ${formatIsoDateToPtBr(transactionDateRange.minDate)} e ${formatIsoDateToPtBr(transactionDateRange.maxDate)}.`,
      };
    }

    const transaction = createTransaction({ type, value }, isoDate);
    dispatchAccountAction({
      type: AccountActionType.APPEND_TRANSACTION,
      transaction,
    });

    return {
      ok: true,
    };
  };

  const onDeleteTransaction = (transactionId: number) => {
    dispatchAccountAction({
      type: AccountActionType.DELETE_TRANSACTION,
      transactionId,
    });
  };

  const onEditTransaction = ({
    transactionId,
    type,
    value,
    transactionDate,
  }: EditTransactionPayload): NewTransactionResult => {
    const transactionToEdit = accountState.transactions.find(
      (transaction) => transaction.id === transactionId
    );
    if (!transactionToEdit) {
      return {
        ok: false,
        message: 'Lançamento não encontrado para edição.',
      };
    }

    const isoDate = toTransactionIsoDate(transactionDate, transactionDateRange);
    if (!isoDate) {
      return {
        ok: false,
        message: `Data inválida. Selecione uma data entre ${formatIsoDateToPtBr(transactionDateRange.minDate)} e ${formatIsoDateToPtBr(transactionDateRange.maxDate)}.`,
      };
    }

    const currentSignedValue =
      transactionToEdit.type === TransactionType.TRANSFER
        ? -transactionToEdit.value
        : transactionToEdit.value;
    const nextSignedValue = type === TransactionType.TRANSFER ? -value : value;
    const projectedBalance = accountState.balance - currentSignedValue + nextSignedValue;

    if (projectedBalance < 0) {
      return {
        ok: false,
        message: 'Saldo insuficiente para concluir a transferência.',
      };
    }

    dispatchAccountAction({
      type: AccountActionType.EDIT_TRANSACTION,
      transactionId,
      nextValue: value,
      nextType: type,
      nextDate: isoDate,
    });

    return {
      ok: true,
    };
  };

  return (
    <AccountContext.Provider
      value={{
        status,
        errorMessage,
        balance: accountState.balance,
        transactions: accountState.transactions,
        onSubmitTransaction,
        onDeleteTransaction,
        onEditTransaction,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccountContext(): AccountContextValue {
  const context = useContext(AccountContext);

  if (!context) {
    throw new Error('useAccountContext must be used within an AccountProvider');
  }

  return context;
}
