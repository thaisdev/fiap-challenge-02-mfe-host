import { describe, expect, it } from 'vitest';
import { TransactionType } from '../../_components/interfaces/statement-panel.interfaces';
import { accountActions, accountReducer } from './account.slice';

const transaction = {
  id: 1,
  type: TransactionType.DEPOSIT,
  date: '2026-06-20T12:00:00.000Z',
  value: 450,
};

describe('accountSlice', () => {
  it('inicia com saldo, transacoes e resumo financeiro vazios', () => {
    const state = accountReducer(undefined, { type: 'unknown' });

    expect(state.data).toEqual({ balance: 0 });
    expect(state.request).toEqual({ status: 'idle', errorMessage: null });
    expect(state.latestTransactions.data).toEqual([]);
    expect(state.transactionsPage.pagination).toMatchObject({
      page: 1,
      limit: 10,
      totalItems: 0,
      totalPages: 0,
    });
    expect(state.financialSummary.data).toEqual({
      balance: 0,
      depositsTotal: 0,
      transfersTotal: 0,
      transactions: [],
    });
  });

  it('hidrata apenas o saldo da conta', () => {
    const state = accountReducer(
      undefined,
      accountActions.hydrateAccount({
        balance: 450,
      })
    );

    expect(state.data.balance).toBe(450);
    expect(state.request).toEqual({ status: 'ready', errorMessage: null });
  });

  it('limpa o saldo atual quando uma nova busca de conta comeca', () => {
    const readyState = accountReducer(
      undefined,
      accountActions.hydrateAccount({
        balance: 120,
      })
    );

    const loadingState = accountReducer(readyState, accountActions.setAccountLoading());

    expect(loadingState.data).toEqual({ balance: 0 });
    expect(loadingState.request).toEqual({ status: 'loading', errorMessage: null });
  });

  it('hidrata a pagina de transacoes com metadados de paginacao', () => {
    const state = accountReducer(
      undefined,
      accountActions.hydrateTransactionsPage({
        data: [transaction],
        pagination: {
          page: 2,
          limit: 10,
          totalItems: 15,
          totalPages: 2,
          hasNextPage: false,
          hasPreviousPage: true,
        },
      })
    );

    expect(state.transactionsPage.data).toEqual([transaction]);
    expect(state.transactionsPage.pagination.page).toBe(2);
    expect(state.transactionsPage.request).toEqual({ status: 'ready', errorMessage: null });
  });

  it('hidrata o resumo financeiro sem depender das transacoes paginadas', () => {
    const state = accountReducer(
      undefined,
      accountActions.hydrateFinancialSummary({
        balance: 7700,
        depositsTotal: 9700,
        transfersTotal: 2000,
      })
    );

    expect(state.financialSummary.data).toEqual({
      balance: 7700,
      depositsTotal: 9700,
      transfersTotal: 2000,
      transactions: [],
    });
  });
});
