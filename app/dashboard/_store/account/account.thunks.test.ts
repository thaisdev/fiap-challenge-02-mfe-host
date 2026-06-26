import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAccountByUserId } from '@/app/home/_services/auth-service';
import {
  addTransaction,
  deleteTransaction,
  fetchFinancialSummary,
  fetchTransactions,
  updateTransaction,
} from '../../_services/transaction-service';
import { TransactionType } from '../../_components/interfaces/statement-panel.interfaces';
import { makeDashboardStore } from '../store';
import { accountActions } from './account.slice';
import {
  deleteAccountTransaction,
  editAccountTransaction,
  loadAccount,
  loadDashboardData,
  submitTransaction,
} from './account.thunks';

vi.mock('@/app/home/_services/auth-service', () => ({
  fetchAccountByUserId: vi.fn(),
}));

vi.mock('../../_services/transaction-service', () => ({
  addTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  fetchFinancialSummary: vi.fn(),
  fetchTransactions: vi.fn(),
  updateTransaction: vi.fn(),
}));

const fetchAccountByUserIdMock = vi.mocked(fetchAccountByUserId);
const addTransactionMock = vi.mocked(addTransaction);
const deleteTransactionMock = vi.mocked(deleteTransaction);
const fetchFinancialSummaryMock = vi.mocked(fetchFinancialSummary);
const fetchTransactionsMock = vi.mocked(fetchTransactions);
const updateTransactionMock = vi.mocked(updateTransaction);

const paginatedTransactions = {
  data: [
    {
      id: 1,
      type: TransactionType.DEPOSIT,
      date: '2026-06-20T12:00:00.000Z',
      value: 250,
    },
  ],
  pagination: {
    page: 1,
    limit: 6,
    totalItems: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  },
};

describe('account thunks', () => {
  beforeEach(() => {
    fetchAccountByUserIdMock.mockReset();
    addTransactionMock.mockReset();
    deleteTransactionMock.mockReset();
    fetchFinancialSummaryMock.mockReset();
    fetchTransactionsMock.mockReset();
    updateTransactionMock.mockReset();

    fetchAccountByUserIdMock.mockResolvedValue({
      ok: true,
      account: { balance: 250 },
    });
    fetchTransactionsMock.mockResolvedValue({
      ok: true,
      transactions: paginatedTransactions,
    });
    fetchFinancialSummaryMock.mockResolvedValue({
      ok: true,
      summary: {
        balance: 250,
        depositsTotal: 250,
        transfersTotal: 0,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('carrega a conta e hidrata o estado global', async () => {
    const store = makeDashboardStore();
    fetchAccountByUserIdMock.mockResolvedValue({
      ok: true,
      account: {
        balance: 250,
      },
    });

    await store.dispatch(loadAccount({ userId: 969, token: 'token-123' }));

    expect(fetchAccountByUserIdMock).toHaveBeenCalledWith(969, 'token-123');
    expect(store.getState().account.data.balance).toBe(250);
    expect(store.getState().account.request.status).toBe('ready');
  });

  it('bloqueia transferência maior que o saldo sem chamar a API', async () => {
    const store = makeDashboardStore();
    store.dispatch(accountActions.hydrateAccount({ balance: 100 }));

    const result = await store.dispatch(
      submitTransaction({
        userId: 969,
        token: 'token-123',
        payload: {
          type: TransactionType.TRANSFER,
          value: 999,
          transactionDate: '2026-06-20',
        },
      })
    );

    expect(result).toEqual({
      ok: false,
      message: 'Saldo insuficiente para concluir a transferência.',
    });
    expect(addTransactionMock).not.toHaveBeenCalled();
  });

  it('adiciona transação e refaz as requisições do servidor quando a API aceita', async () => {
    const store = makeDashboardStore();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-21T18:30:00.000Z'));

    store.dispatch(accountActions.hydrateAccount({ balance: 100 }));
    addTransactionMock.mockResolvedValue({ ok: true });
    fetchAccountByUserIdMock.mockResolvedValue({ ok: true, account: { balance: 150 } });

    const result = await store.dispatch(
      submitTransaction({
        userId: 969,
        token: 'token-123',
        payload: {
          type: TransactionType.DEPOSIT,
          value: 50,
          transactionDate: '2026-06-21',
        },
      })
    );

    expect(result).toEqual({ ok: true });
    expect(addTransactionMock).toHaveBeenCalledWith(
      969,
      'token-123',
      expect.objectContaining({
        type: TransactionType.DEPOSIT,
        value: 50,
        date: '2026-06-21T18:30:00.000Z',
      })
    );
    expect(fetchAccountByUserIdMock).toHaveBeenCalledWith(969, 'token-123');
    expect(fetchTransactionsMock).toHaveBeenCalled();
    expect(fetchFinancialSummaryMock).toHaveBeenCalled();
    expect(store.getState().account.data.balance).toBe(150);
    expect(store.getState().account.financialSummary.data).toMatchObject({
      balance: 250,
      depositsTotal: 250,
      transfersTotal: 0,
    });
    expect(store.getState().account.latestTransactions.data).toEqual(paginatedTransactions.data);
  });

  it('edita transação e refaz as requisições do servidor quando a API aceita', async () => {
    const store = makeDashboardStore();
    store.dispatch(accountActions.hydrateAccount({ balance: 500 }));
    store.dispatch(
      accountActions.hydrateLatestTransactions({
        data: [
          {
            id: 1,
            type: TransactionType.DEPOSIT,
            date: '2026-06-20T12:00:00.000Z',
            value: 100,
          },
        ],
        pagination: {
          page: 1,
          limit: 6,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      })
    );
    updateTransactionMock.mockResolvedValue({ ok: true });
    fetchAccountByUserIdMock.mockResolvedValue({ ok: true, account: { balance: 360 } });

    const result = await store.dispatch(
      editAccountTransaction({
        userId: 969,
        token: 'token-123',
        payload: {
          transactionId: 1,
          type: TransactionType.TRANSFER,
          value: 40,
          transactionDate: '2026-06-21',
        },
      })
    );

    expect(result).toEqual({ ok: true });
    expect(updateTransactionMock).toHaveBeenCalledWith(
      969,
      'token-123',
      1,
      expect.objectContaining({ type: TransactionType.TRANSFER, value: 40 })
    );
    expect(fetchAccountByUserIdMock).toHaveBeenCalledWith(969, 'token-123');
    expect(fetchTransactionsMock).toHaveBeenCalled();
    expect(fetchFinancialSummaryMock).toHaveBeenCalled();
    expect(store.getState().account.data.balance).toBe(360);
    expect(store.getState().account.latestTransactions.data).toEqual(paginatedTransactions.data);
  });

  it('exclui transação e refaz as requisições do servidor quando a API aceita', async () => {
    const store = makeDashboardStore();
    store.dispatch(accountActions.hydrateAccount({ balance: 120 }));
    store.dispatch(
      accountActions.hydrateLatestTransactions({
        data: [
          {
            id: 1,
            type: TransactionType.TRANSFER,
            date: '2026-06-20T12:00:00.000Z',
            value: 80,
          },
        ],
        pagination: {
          page: 1,
          limit: 6,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      })
    );
    deleteTransactionMock.mockResolvedValue({ ok: true });
    fetchAccountByUserIdMock.mockResolvedValue({ ok: true, account: { balance: 200 } });
    fetchTransactionsMock.mockResolvedValue({
      ok: true,
      transactions: { data: [], pagination: { ...paginatedTransactions.pagination, totalItems: 0, totalPages: 0 } },
    });

    const result = await store.dispatch(
      deleteAccountTransaction({
        userId: 969,
        token: 'token-123',
        transactionId: 1,
      })
    );

    expect(result).toEqual({ ok: true });
    expect(deleteTransactionMock).toHaveBeenCalledWith(969, 'token-123', 1);
    expect(fetchAccountByUserIdMock).toHaveBeenCalledWith(969, 'token-123');
    expect(fetchTransactionsMock).toHaveBeenCalled();
    expect(fetchFinancialSummaryMock).toHaveBeenCalled();
    expect(store.getState().account.data.balance).toBe(200);
    expect(store.getState().account.latestTransactions.data).toEqual([]);
  });

  it('valida exclusão e edição usando o estado atual da store', async () => {
    const store = makeDashboardStore();
    store.dispatch(accountActions.hydrateAccount({ balance: 120 }));

    await expect(
      store.dispatch(
        deleteAccountTransaction({
          userId: 969,
          token: 'token-123',
          transactionId: 999,
        })
      )
    ).resolves.toMatchObject({ ok: false, message: expect.stringContaining('não encontrado') });

    await expect(
      store.dispatch(
        editAccountTransaction({
          userId: 969,
          token: 'token-123',
          payload: {
            transactionId: 999,
            type: TransactionType.DEPOSIT,
            value: 10,
            transactionDate: '2026-06-20',
          },
        })
      )
    ).resolves.toMatchObject({ ok: false, message: expect.stringContaining('não encontrado') });

    expect(deleteTransactionMock).not.toHaveBeenCalled();
    expect(updateTransactionMock).not.toHaveBeenCalled();
  });

  it('carrega os dados iniciais do dashboard em endpoints separados', async () => {
    const store = makeDashboardStore();
    fetchAccountByUserIdMock.mockResolvedValue({
      ok: true,
      account: {
        balance: 7700,
      },
    });
    fetchFinancialSummaryMock.mockResolvedValue({
      ok: true,
      summary: {
        balance: 7700,
        depositsTotal: 9700,
        transfersTotal: 2000,
      },
    });

    await store.dispatch(loadDashboardData({ userId: 969, token: 'token-123' }));

    expect(fetchAccountByUserIdMock).toHaveBeenCalledWith(969, 'token-123');
    expect(fetchTransactionsMock).toHaveBeenCalledWith(969, 'token-123', {
      page: 1,
      limit: 6,
    });
    expect(fetchFinancialSummaryMock).toHaveBeenCalledWith(969, 'token-123');
    expect(store.getState().account.data.balance).toBe(7700);
    expect(store.getState().account.financialSummary.data.depositsTotal).toBe(9700);
  });
});
