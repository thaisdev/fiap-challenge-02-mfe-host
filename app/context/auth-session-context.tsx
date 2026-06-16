'use client';

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  AUTH_SESSION_CHANGED_EVENT,
  AUTH_SESSION_STORAGE_KEY,
  parseAuthSession,
  setAuthSession,
  type AuthSession,
} from '../lib/auth-session';
import type {
  NewTransactionPayload,
  NewTransactionResult,
} from '../dashboard/_components/interfaces/new-transaction-panel.interfaces';
import type {
  EditTransactionPayload,
  Transaction,
} from '../dashboard/_components/interfaces/statement-panel.interfaces';
import { TransactionType } from '../dashboard/_components/interfaces/statement-panel.interfaces';
import {
  AccountActionType,
  accountReducer,
  createAccountState,
} from '../dashboard/_state/account.reducer';
import {
  formatIsoDateToPtBr,
  getTransactionDateRange,
  toTransactionIsoDate,
} from '../dashboard/_utils/transaction-date';

export type AuthSessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthSessionContextValue = {
  session: AuthSession | null;
  status: AuthSessionStatus;
  transactions: Transaction[];
  balance: number;
  onSubmitTransaction: (payload: NewTransactionPayload) => NewTransactionResult;
  onDeleteTransaction: (transactionId: number) => void;
  onEditTransaction: (payload: EditTransactionPayload) => NewTransactionResult;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

const SERVER_SNAPSHOT = '__server_snapshot__';
const EMPTY_SNAPSHOT = '__empty_snapshot__';

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

function subscribe(onStoreChange: () => void) {
  const onStorageChange = (event: StorageEvent) => {
    if (event.storageArea !== window.sessionStorage) {
      return;
    }

    if (event.key && event.key !== AUTH_SESSION_STORAGE_KEY) {
      return;
    }

    onStoreChange();
  };

  const onSessionChangedEvent = () => onStoreChange();

  window.addEventListener('storage', onStorageChange);
  window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChangedEvent);

  return () => {
    window.removeEventListener('storage', onStorageChange);
    window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChangedEvent);
  };
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function getClientSnapshot() {
  return window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY) ?? EMPTY_SNAPSHOT;
}

type AuthSessionProviderProps = {
  children: ReactNode;
};

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const serializedSession = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const session =
    serializedSession === SERVER_SNAPSHOT || serializedSession === EMPTY_SNAPSHOT
      ? null
      : parseAuthSession(serializedSession);

  useEffect(() => {
    if (!session || serializedSession === SERVER_SNAPSHOT || serializedSession === EMPTY_SNAPSHOT) {
      return;
    }

    const normalizedSerializedSession = JSON.stringify(session);

    if (normalizedSerializedSession !== serializedSession) {
      setAuthSession(session);
    }
  }, [serializedSession, session]);

  const status: AuthSessionStatus =
    serializedSession === SERVER_SNAPSHOT
      ? 'loading'
      : session
        ? 'authenticated'
        : 'unauthenticated';

  const initialBalance = session?.user.account.balance ?? 0;
  const initialTransactions = session?.user.account.transactions ?? [];
  const [accountState, dispatchAccountAction] = useReducer(
    accountReducer,
    createAccountState(initialBalance, initialTransactions)
  );
  const transactionDateRange = getTransactionDateRange();
  const lastHydratedSnapshotRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      !session ||
      serializedSession === SERVER_SNAPSHOT ||
      serializedSession === EMPTY_SNAPSHOT ||
      lastHydratedSnapshotRef.current === serializedSession
    ) {
      return;
    }

    lastHydratedSnapshotRef.current = serializedSession;
    dispatchAccountAction({
      type: AccountActionType.HYDRATE_FROM_PROPS,
      balance: session.user.account.balance,
      transactions: session.user.account.transactions ?? [],
    });
  }, [serializedSession, session]);

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
    <AuthSessionContext.Provider
      value={{
        session,
        status,
        onSubmitTransaction,
        onDeleteTransaction,
        onEditTransaction,
        transactions: accountState.transactions,
        balance: accountState.balance,
      }}
    >
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSessionContext(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSessionContext must be used within an AuthSessionProvider');
  }

  return context;
}
