import { describe, expect, it } from 'vitest';
import {
  AccountActionType,
  accountReducer,
  createAccountState,
  type AccountAction,
} from './account.reducer';
import { TransactionType } from '../_components/interfaces/statement-panel.interfaces';

const baseTransactions = [
  {
    id: 1,
    type: TransactionType.DEPOSIT,
    date: '2022-11-18T12:00:00.000Z',
    value: 150,
  },
  {
    id: 2,
    type: TransactionType.TRANSFER,
    date: '2022-11-21T12:00:00.000Z',
    value: 50,
  },
] as const;

describe('account.reducer', () => {
  it('cria estado inicial com clone do extrato', () => {
    const state = createAccountState(2500, baseTransactions);

    expect(state.balance).toBe(2500);
    expect(state.transactions).toEqual(baseTransactions);
    expect(state.transactions).not.toBe(baseTransactions);
  });

  it('hidrata estado a partir das props', () => {
    const initialState = createAccountState(1, []);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.HYDRATE_FROM_PROPS,
      balance: 2500,
      transactions: baseTransactions,
    });

    expect(nextState.balance).toBe(2500);
    expect(nextState.transactions).toEqual(baseTransactions);
  });

  it('adiciona lancamento e atualiza saldo', () => {
    const initialState = createAccountState(2500, baseTransactions);
    const newTransaction = {
      id: 3,
      type: TransactionType.DEPOSIT,
      date: '2022-11-21T12:00:00.000Z',
      value: 70,
    };

    const nextState = accountReducer(initialState, {
      type: AccountActionType.APPEND_TRANSACTION,
      transaction: newTransaction,
    });

    expect(nextState.balance).toBe(2570);
    expect(nextState.transactions[0]).toEqual(newTransaction);
  });

  it('remove lancamento existente e reverte saldo', () => {
    const initialState = createAccountState(2500, baseTransactions);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.DELETE_TRANSACTION,
      transactionId: 2,
    });

    expect(nextState.balance).toBe(2550);
    expect(nextState.transactions).toHaveLength(1);
    expect(nextState.transactions[0]?.id).toBe(1);
  });

  it('mantem estado quando delete recebe id inexistente', () => {
    const initialState = createAccountState(2500, baseTransactions);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.DELETE_TRANSACTION,
      transactionId: 999,
    });

    expect(nextState).toBe(initialState);
  });

  it('edita transferencia normalizando para valor positivo armazenado', () => {
    const initialState = createAccountState(2500, baseTransactions);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.EDIT_TRANSACTION,
      transactionId: 2,
      nextValue: 70,
      nextType: TransactionType.TRANSFER,
      nextDate: '2022-12-10T12:00:00.000Z',
    });

    expect(nextState.balance).toBe(2480);
    const editedTransfer = nextState.transactions.find((transaction) => transaction.id === 2);
    expect(editedTransfer?.value).toBe(70);
    expect(editedTransfer?.type).toBe(TransactionType.TRANSFER);
    expect(editedTransfer?.date).toBe('2022-12-10T12:00:00.000Z');
  });

  it('edita deposito normalizando para valor absoluto', () => {
    const initialState = createAccountState(2500, baseTransactions);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.EDIT_TRANSACTION,
      transactionId: 1,
      nextValue: -200,
      nextType: TransactionType.DEPOSIT,
      nextDate: '2023-01-02T12:00:00.000Z',
    });

    expect(nextState.balance).toBe(2550);
    const editedDeposit = nextState.transactions.find((transaction) => transaction.id === 1);
    expect(editedDeposit?.value).toBe(200);
    expect(editedDeposit?.type).toBe(TransactionType.DEPOSIT);
    expect(editedDeposit?.date).toBe('2023-01-02T12:00:00.000Z');
  });

  it('mantem estado quando edit recebe id inexistente', () => {
    const initialState = createAccountState(2500, baseTransactions);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.EDIT_TRANSACTION,
      transactionId: 999,
      nextValue: 1,
      nextType: TransactionType.DEPOSIT,
      nextDate: '2022-11-18T12:00:00.000Z',
    });

    expect(nextState).toBe(initialState);
  });

  it('retorna estado atual para acao desconhecida', () => {
    const initialState = createAccountState(2500, baseTransactions);

    const nextState = accountReducer(initialState, {
      type: 'acao-desconhecida',
    } as unknown as AccountAction);

    expect(nextState).toBe(initialState);
  });
});
