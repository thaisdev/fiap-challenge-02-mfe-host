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
  updateTransaction,
} from '../../_services/transaction-service';
import {
  formatIsoDateToPtBr,
  getTransactionDateRange,
  toTransactionIsoDate,
} from '../../_utils/transaction-date';
import type { AppThunk } from '../store';
import { accountActions } from './account.slice';
import { selectAccountData } from './account.selectors';

type AccountSessionParams = {
  userId: number;
  token: string;
};

function createTransactionId() {
  return Date.now() + Math.floor(Math.random() * 1000);
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
          transactions: [...result.account.transactions],
        })
      );
      return;
    }

    dispatch(accountActions.setAccountError(result.message));
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
        message: 'Saldo insuficiente para concluir a transferencia.',
      };
    }

    const isoDate = toTransactionIsoDate(payload.transactionDate, transactionDateRange);
    if (!isoDate) {
      return {
        ok: false,
        message: `Data invalida. Selecione uma data entre ${formatIsoDateToPtBr(transactionDateRange.minDate)} e ${formatIsoDateToPtBr(transactionDateRange.maxDate)}.`,
      };
    }

    const transaction = createTransaction(payload, isoDate);
    const result = await addTransaction(userId, token, transaction);

    if (!result.ok) {
      return result;
    }

    await dispatch(loadAccount({ userId, token }));

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
    const transactionToDelete = account.transactions.find(
      (transaction) => transaction.id === transactionId
    );

    if (!transactionToDelete) {
      return {
        ok: false,
        message: 'Lancamento nao encontrado para exclusao.',
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
        message: 'Nao e possivel excluir este lancamento pois resultaria em saldo negativo.',
      };
    }

    const result = await deleteTransaction(userId, token, transactionId);

    if (!result.ok) {
      return result;
    }

    await dispatch(loadAccount({ userId, token }));

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
    const transactionToEdit = account.transactions.find(
      (transaction) => transaction.id === payload.transactionId
    );

    if (!transactionToEdit) {
      return {
        ok: false,
        message: 'Lancamento nao encontrado para edicao.',
      };
    }

    const isoDate = toTransactionIsoDate(payload.transactionDate, transactionDateRange);
    if (!isoDate) {
      return {
        ok: false,
        message: `Data invalida. Selecione uma data entre ${formatIsoDateToPtBr(transactionDateRange.minDate)} e ${formatIsoDateToPtBr(transactionDateRange.maxDate)}.`,
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
        message: 'Saldo insuficiente para concluir esta operacao.',
      };
    }

    const result = await updateTransaction(userId, token, payload.transactionId, {
      id: payload.transactionId,
      type: payload.type,
      value: Math.abs(payload.value),
      date: isoDate,
    });

    if (!result.ok) {
      return result;
    }

    await dispatch(loadAccount({ userId, token }));

    return { ok: true };
  };
}
