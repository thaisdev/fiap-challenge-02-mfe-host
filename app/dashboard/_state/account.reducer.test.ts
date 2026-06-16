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

  it('retorna estado atual para acao desconhecida', () => {
    const initialState = createAccountState(2500, baseTransactions);

    const nextState = accountReducer(initialState, {
      type: 'acao-desconhecida',
    } as unknown as AccountAction);

    expect(nextState).toBe(initialState);
  });
});
