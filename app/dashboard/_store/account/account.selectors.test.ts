import { describe, expect, it } from 'vitest';
import { TransactionType } from '../../_components/interfaces/statement-panel.interfaces';
import type { RootState } from '../store';
import { selectFinancialVisibilityData } from './account.selectors';

describe('account selectors', () => {
  it('deriva os totais financeiros usados pelo microfrontend', () => {
    const state = {
      account: {
        data: {
          balance: 700,
          transactions: [
            {
              id: 1,
              type: TransactionType.DEPOSIT,
              date: '2026-06-20T12:00:00.000Z',
              value: 500,
            },
            {
              id: 2,
              type: TransactionType.TRANSFER,
              date: '2026-06-20T12:00:00.000Z',
              value: 80,
            },
            {
              id: 3,
              type: TransactionType.DEPOSIT,
              date: '2026-06-20T12:00:00.000Z',
              value: 200,
            },
          ],
        },
        request: {
          status: 'ready',
          errorMessage: null,
        },
      },
    } satisfies RootState;

    expect(selectFinancialVisibilityData(state)).toEqual({
      balance: 700,
      depositsTotal: 700,
      transfersTotal: 80,
      transactions: state.account.data.transactions,
    });
  });

  it('retorna uma copia das transacoes para proteger a fronteira do microfrontend', () => {
    const state = {
      account: {
        data: {
          balance: 500,
          transactions: [
            {
              id: 1,
              type: TransactionType.DEPOSIT,
              date: '2026-06-20T12:00:00.000Z',
              value: 500,
            },
          ],
        },
        request: {
          status: 'ready',
          errorMessage: null,
        },
      },
    } satisfies RootState;

    const data = selectFinancialVisibilityData(state);

    expect(data.transactions).not.toBe(state.account.data.transactions);
    expect(data.transactions[0]).not.toBe(state.account.data.transactions[0]);
    expect(data.transactions).toEqual(state.account.data.transactions);
  });
});
