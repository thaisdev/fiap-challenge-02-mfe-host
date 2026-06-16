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
import type { EditStatementEntryPayload } from '../dashboard/_components/interfaces/statement-panel.interfaces';
import type { StatementEntry } from '../dashboard/_components/interfaces/statement-panel.interfaces';
import {
  AccountActionType,
  accountReducer,
  createAccountState,
} from '../dashboard/_state/account.reducer';
import {
  formatIsoDateToPtBr,
  getTransactionDateRange,
  toStatementDate,
  type TransactionStatementDate,
} from '../dashboard/_utils/transaction-date';
import {
  StatementEntryType,
  TransactionType,
  toStatementEntryType,
} from '../dashboard/_components/interfaces/statement-panel.interfaces';

export type AuthSessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthSessionContextValue = {
  session: AuthSession | null;
  status: AuthSessionStatus;
  statementEntries: StatementEntry[];
  balance: number;
  onSubmitTransaction: (payload: NewTransactionPayload) => NewTransactionResult;
  onDeleteStatementEntry: (entryId: string) => void;
  onEditStatementEntry: (payload: EditStatementEntryPayload) => NewTransactionResult;
};

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

const SERVER_SNAPSHOT = '__server_snapshot__';
const EMPTY_SNAPSHOT = '__empty_snapshot__';

function createStatementEntry(
  { type, amount }: Omit<NewTransactionPayload, 'transactionDate'>,
  statementDate: TransactionStatementDate
): StatementEntry {
  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    month: statementDate.monthLabel,
    type: toStatementEntryType(type),
    amount: type === TransactionType.DEPOSIT ? amount : -amount,
    date: statementDate.dateLabel,
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

  const initialBalance = session?.user.accountBalance ?? 0;
  const initialStatementEntries = session?.user.statementEntries ?? [];
  const [accountState, dispatchAccountAction] = useReducer(
    accountReducer,
    createAccountState(initialBalance, initialStatementEntries)
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
      balance: session.user.accountBalance,
      statementEntries: session.user.statementEntries ?? [],
    });
  }, [serializedSession, session]);

  const onSubmitTransaction = ({
    type,
    amount,
    transactionDate,
  }: NewTransactionPayload): NewTransactionResult => {
    if (type === TransactionType.TRANSFER && amount > accountState.currentBalance) {
      return {
        ok: false,
        message: 'Saldo insuficiente para concluir a transferência.',
      };
    }

    const statementDate = toStatementDate(transactionDate, transactionDateRange);
    if (!statementDate) {
      return {
        ok: false,
        message: `Data inválida. Selecione uma data entre ${formatIsoDateToPtBr(transactionDateRange.minDate)} e ${formatIsoDateToPtBr(transactionDateRange.maxDate)}.`,
      };
    }

    const entry = createStatementEntry({ type, amount }, statementDate);
    dispatchAccountAction({
      type: AccountActionType.APPEND_TRANSACTION_ENTRY,
      entry,
    });

    return {
      ok: true,
    };
  };

  const onDeleteStatementEntry = (entryId: string) => {
    dispatchAccountAction({
      type: AccountActionType.DELETE_STATEMENT_ENTRY,
      entryId,
    });
  };

  const onEditStatementEntry = ({
    entryId,
    type,
    amount,
    transactionDate,
  }: EditStatementEntryPayload): NewTransactionResult => {
    const entryToEdit = accountState.currentStatementEntries.find((entry) => entry.id === entryId);
    if (!entryToEdit) {
      return {
        ok: false,
        message: 'Lançamento não encontrado para edição.',
      };
    }

    const statementDate = toStatementDate(transactionDate, transactionDateRange);
    if (!statementDate) {
      return {
        ok: false,
        message: `Data inválida. Selecione uma data entre ${formatIsoDateToPtBr(transactionDateRange.minDate)} e ${formatIsoDateToPtBr(transactionDateRange.maxDate)}.`,
      };
    }

    const nextSignedAmount = type === TransactionType.DEPOSIT ? amount : -amount;
    const projectedBalance = accountState.currentBalance - entryToEdit.amount + nextSignedAmount;

    if (projectedBalance < 0) {
      return {
        ok: false,
        message: 'Saldo insuficiente para concluir a transferência.',
      };
    }

    dispatchAccountAction({
      type: AccountActionType.EDIT_STATEMENT_ENTRY,
      entryId,
      nextAmount: amount,
      nextType:
        type === TransactionType.DEPOSIT ? StatementEntryType.DEPOSIT : StatementEntryType.TRANSFER,
      nextMonth: statementDate.monthLabel,
      nextDate: statementDate.dateLabel,
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
        onDeleteStatementEntry,
        onEditStatementEntry,
        statementEntries: accountState.currentStatementEntries,
        balance: accountState.currentBalance,
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
