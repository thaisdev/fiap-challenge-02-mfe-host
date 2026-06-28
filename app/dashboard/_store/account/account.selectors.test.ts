import { describe, expect, it } from 'vitest';
import { TransactionType } from '../../_components/interfaces/statement-panel.interfaces';
import type { RootState } from '../store';
import { selectFinancialVisibilityData, selectKnownTransactions } from './account.selectors';

function baseState(): RootState {
  return {
    account: {
      data: {
        balance: 700,
      },
      request: {
        status: 'ready',
        errorMessage: null,
      },
      latestTransactions: {
        data: [
          {
            id: 1,
            type: TransactionType.DEPOSIT,
            date: '2026-06-20T12:00:00.000Z',
            value: 500,
          },
        ],
        request: {
          status: 'ready',
          errorMessage: null,
        },
      },
      transactionsPage: {
        data: [
          {
            id: 1,
            type: TransactionType.DEPOSIT,
            date: '2026-06-20T12:00:00.000Z',
            value: 500,
          },
          {
            id: 2,
            type: TransactionType.TRANSFER,
            date: '2026-06-21T12:00:00.000Z',
            value: 80,
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 2,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        request: {
          status: 'ready',
          errorMessage: null,
        },
      },
      financialSummary: {
        data: {
          balance: 700,
          depositsTotal: 9700,
          transfersTotal: 2000,
          transactions: [],
        },
        request: {
          status: 'ready',
          errorMessage: null,
        },
      },
    },
  };
}

describe('account selectors', () => {
  it('retorna o resumo financeiro vindo da API para o microfrontend', () => {
    const state = baseState();

    expect(selectFinancialVisibilityData(state)).toEqual({
      balance: 700,
      depositsTotal: 9700,
      transfersTotal: 2000,
      transactions: [],
    });
  });

  it('combina transacoes conhecidas sem duplicar itens entre extrato lateral e pagina', () => {
    const state = baseState();

    expect(selectKnownTransactions(state).map((transaction) => transaction.id)).toEqual([1, 2]);
  });
});
