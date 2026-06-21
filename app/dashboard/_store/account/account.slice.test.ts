import { describe, expect, it } from 'vitest';
import { TransactionType } from '../../_components/interfaces/statement-panel.interfaces';
import { accountActions, accountReducer } from './account.slice';

describe('accountSlice', () => {
  it('inicia com conta vazia e request idle', () => {
    const state = accountReducer(undefined, { type: 'unknown' });

    expect(state).toEqual({
      data: {
        balance: 0,
        transactions: [],
      },
      request: {
        status: 'idle',
        errorMessage: null,
      },
    });
  });

  it('hidrata saldo e transacoes da conta', () => {
    const state = accountReducer(
      undefined,
      accountActions.hydrateAccount({
        balance: 450,
        transactions: [
          {
            id: 1,
            type: TransactionType.DEPOSIT,
            date: '2026-06-20T12:00:00.000Z',
            value: 450,
          },
        ],
      })
    );

    expect(state.data.balance).toBe(450);
    expect(state.data.transactions).toHaveLength(1);
    expect(state.request).toEqual({ status: 'ready', errorMessage: null });
  });

  it('limpa os dados atuais quando uma nova busca comeca', () => {
    const readyState = accountReducer(
      undefined,
      accountActions.hydrateAccount({
        balance: 120,
        transactions: [],
      })
    );

    const loadingState = accountReducer(readyState, accountActions.setAccountLoading());

    expect(loadingState.data).toEqual({ balance: 0, transactions: [] });
    expect(loadingState.request).toEqual({ status: 'loading', errorMessage: null });
  });

  it('registra erro sem apagar novamente os dados atuais da conta', () => {
    const readyState = accountReducer(
      undefined,
      accountActions.hydrateAccount({
        balance: 120,
        transactions: [],
      })
    );

    const errorState = accountReducer(readyState, accountActions.setAccountError('Falha na API'));

    expect(errorState.data.balance).toBe(120);
    expect(errorState.request).toEqual({ status: 'error', errorMessage: 'Falha na API' });
  });
});
