import { fetchAccountByUserId } from '@/app/home/_services/auth-service';
import type {
  NewTransactionPayload,
  NewTransactionResult,
} from '../../_components/interfaces/new-transaction-panel.interfaces';
import type {
  EditTransactionPayload,
  Transaction,
} from '../../_components/interfaces/statement-panel.interfaces';
import { TransactionType } from '../../_components/interfaces/statement-panel.interfaces';
import {
  addTransaction,
  deleteTransaction,
  fetchFinancialSummary,
  fetchTransactions,
  updateTransaction,
} from '../../_services/transaction-service';
import {
  dateOnlyFromTransactionDate,
  formatIsoDateToPtBr,
  getDefaultTransactionDate,
  getTransactionDateRange,
  toTransactionIsoDate,
} from '../../_utils/transaction-date';
import type { AppThunk } from '../store';
import { accountActions } from './account.slice';
import { selectAccountData, selectKnownTransactions } from './account.selectors';

type AccountSessionParams = {
  userId: number;
  token: string;
};

function createTransactionId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function resolveCreatedTransactionDate(isoDate: string) {
  const selectedDate = dateOnlyFromTransactionDate(isoDate);

  if (selectedDate !== getDefaultTransactionDate()) {
    return isoDate;
  }

  return new Date().toISOString();
}

function createTransaction(
  { type, value }: Omit<NewTransactionPayload, 'transactionDate'>,
  isoDate: string
): Transaction {
  return {
    id: createTransactionId(),
    type,
    value: Math.abs(value),
    date: isoDate,
  };
}

export function loadAccount({
  userId,
  token,
}: AccountSessionParams): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(accountActions.setAccountLoading());

    const result = await fetchAccountByUserId(userId, token);

    if (result.ok) {
      dispatch(
        accountActions.hydrateAccount({
          balance: result.account.balance,
        })
      );
      return;
    }

    dispatch(accountActions.setAccountError(result.message));
  };
}

export function loadLatestTransactions({
  userId,
  token,
  limit = 6,
}: AccountSessionParams & {
  limit?: number;
}): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(accountActions.setLatestTransactionsLoading());

    const result = await fetchTransactions(userId, token, { page: 1, limit });

    if (result.ok) {
      dispatch(accountActions.hydrateLatestTransactions(result.transactions));
      return;
    }

    dispatch(accountActions.setLatestTransactionsError(result.message));
  };
}

export function loadTransactionsPage({
  userId,
  token,
  page = 1,
  limit = 10,
}: AccountSessionParams & {
  page?: number;
  limit?: number;
}): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(accountActions.setTransactionsPageLoading({ page, limit }));

    const result = await fetchTransactions(userId, token, { page, limit });

    if (result.ok) {
      dispatch(accountActions.hydrateTransactionsPage(result.transactions));
      return;
    }

    dispatch(accountActions.setTransactionsPageError(result.message));
  };
}

export function loadFinancialSummary({
  userId,
  token,
}: AccountSessionParams): AppThunk<Promise<void>> {
  return async (dispatch) => {
    dispatch(accountActions.setFinancialSummaryLoading());

    const result = await fetchFinancialSummary(userId, token);

    if (result.ok) {
      dispatch(accountActions.hydrateFinancialSummary(result.summary));
      return;
    }

    dispatch(accountActions.setFinancialSummaryError(result.message));
  };
}

export function loadDashboardData({
  userId,
  token,
}: AccountSessionParams): AppThunk<Promise<void>> {
  return async (dispatch) => {
    await Promise.all([
      dispatch(loadAccount({ userId, token })),
      dispatch(loadLatestTransactions({ userId, token })),
      dispatch(loadFinancialSummary({ userId, token })),
    ]);
  };
}

export function submitTransaction({
  userId,
  token,
  payload,
}: AccountSessionParams & {
  payload: NewTransactionPayload;
}): AppThunk<Promise<NewTransactionResult>> {
  return async (dispatch, getState) => {
    const account = selectAccountData(getState());
    const transactionDateRange = getTransactionDateRange();

    if (payload.type === TransactionType.TRANSFER && payload.value > account.balance) {
      return {
        ok: false,
        message: 'Saldo insuficiente para concluir a transferência.',
      };
    }

    const isoDate = toTransactionIsoDate(payload.transactionDate, transactionDateRange);
    if (!isoDate) {
      return {
        ok: false,
        message: `Data inválida. Selecione uma data entre ${formatIsoDateToPtBr(transactionDateRange.minDate)} e ${formatIsoDateToPtBr(transactionDateRange.maxDate)}.`,
      };
    }

    const transaction = createTransaction(payload, isoDate);
    transaction.date = resolveCreatedTransactionDate(transaction.date);
    const result = await addTransaction(userId, token, { ...transaction, receiptFile: payload.receiptFile })

    if (!result.ok) {
      return result;
    }

    dispatch(accountActions.applyTransactionCreated(transaction));

    return { ok: true };
  };
}

export function deleteAccountTransaction({
  userId,
  token,
  transactionId,
}: AccountSessionParams & {
  transactionId: number;
}): AppThunk<Promise<NewTransactionResult>> {
  return async (dispatch, getState) => {
    const account = selectAccountData(getState());
    const transactionToDelete = selectKnownTransactions(getState()).find(
      (transaction) => transaction.id === transactionId
    );

    if (!transactionToDelete) {
      return {
        ok: false,
        message: 'Lançamento não encontrado para exclusão.',
      };
    }

    const signedValue =
      transactionToDelete.type === TransactionType.TRANSFER
        ? -transactionToDelete.value
        : transactionToDelete.value;
    const projectedBalance = account.balance - signedValue;

    if (projectedBalance < 0) {
      return {
        ok: false,
        message: 'Não é possível excluir este lançamento pois resultaria em saldo negativo.',
      };
    }

    const result = await deleteTransaction(userId, token, transactionId);

    if (!result.ok) {
      return result;
    }

    dispatch(accountActions.applyTransactionDeleted(transactionToDelete));

    return { ok: true };
  };
}

export function editAccountTransaction({
  userId,
  token,
  payload,
}: AccountSessionParams & {
  payload: EditTransactionPayload;
}): AppThunk<Promise<NewTransactionResult>> {
  return async (dispatch, getState) => {
    const account = selectAccountData(getState());
    const transactionDateRange = getTransactionDateRange();
    const transactionToEdit = selectKnownTransactions(getState()).find(
      (transaction) => transaction.id === payload.transactionId
    );

    if (!transactionToEdit) {
      return {
        ok: false,
        message: 'Lançamento não encontrado para edição.',
      };
    }

    const isoDate = toTransactionIsoDate(payload.transactionDate, transactionDateRange);
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
    const nextSignedValue =
      payload.type === TransactionType.TRANSFER ? -payload.value : payload.value;
    const projectedBalance = account.balance - currentSignedValue + nextSignedValue;

    if (projectedBalance < 0) {
      return {
        ok: false,
        message: 'Saldo insuficiente para concluir esta operação.',
      };
    }

    const nextTransaction = {
      id: payload.transactionId,
      type: payload.type,
      value: Math.abs(payload.value),
      date: isoDate,
      receiptFile: payload.receiptFile,
    };
    const result = await updateTransaction(userId, token, payload.transactionId, nextTransaction);

    if (!result.ok) {
      return result;
    }

    dispatch(
      accountActions.applyTransactionUpdated({
        previousTransaction: transactionToEdit,
        nextTransaction,
      })
    );

    return { ok: true };
  };
}
