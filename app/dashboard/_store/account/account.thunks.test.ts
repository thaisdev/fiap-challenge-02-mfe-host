import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fetchAccountByUserId } from '@/app/home/_services/auth-service';
import {
  addTransaction,
  deleteTransaction,
  updateTransaction,
} from '../../_services/transaction-service';
import { TransactionType } from '../../_components/interfaces/statement-panel.interfaces';
import { makeDashboardStore } from '../store';
import { accountActions } from './account.slice';
import {
  deleteAccountTransaction,
  editAccountTransaction,
  loadAccount,
  submitTransaction,
} from './account.thunks';

vi.mock('@/app/home/_services/auth-service', () => ({
  fetchAccountByUserId: vi.fn(),
}));

vi.mock('../../_services/transaction-service', () => ({
  addTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}));

const fetchAccountByUserIdMock = vi.mocked(fetchAccountByUserId);
const addTransactionMock = vi.mocked(addTransaction);
const deleteTransactionMock = vi.mocked(deleteTransaction);
const updateTransactionMock = vi.mocked(updateTransaction);

describe('account thunks', () => {
  beforeEach(() => {
    fetchAccountByUserIdMock.mockReset();
    addTransactionMock.mockReset();
    deleteTransactionMock.mockReset();
    updateTransactionMock.mockReset();
  });

  it('carrega a conta e hidrata o estado global', async () => {
    const store = makeDashboardStore();
    fetchAccountByUserIdMock.mockResolvedValue({
      ok: true,
      account: {
        balance: 250,
        transactions: [
          {
            id: 1,
            type: TransactionType.DEPOSIT,
            date: '2026-06-20T12:00:00.000Z',
            value: 250,
          },
        ],
      },
    });

    await store.dispatch(loadAccount({ userId: 969, token: 'token-123' }));

    expect(fetchAccountByUserIdMock).toHaveBeenCalledWith(969, 'token-123');
    expect(store.getState().account.data.balance).toBe(250);
    expect(store.getState().account.request.status).toBe('ready');
  });

  it('bloqueia transferencia maior que o saldo sem chamar a API', async () => {
    const store = makeDashboardStore();
    store.dispatch(
      accountActions.hydrateAccount({
        balance: 100,
        transactions: [],
      })
    );

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
      message: 'Saldo insuficiente para concluir a transferencia.',
    });
    expect(addTransactionMock).not.toHaveBeenCalled();
  });

  it('adiciona transacao e recarrega a conta quando a API aceita', async () => {
    const store = makeDashboardStore();
    store.dispatch(accountActions.hydrateAccount({ balance: 100, transactions: [] }));
    addTransactionMock.mockResolvedValue({ ok: true });
    fetchAccountByUserIdMock.mockResolvedValue({
      ok: true,
      account: {
        balance: 150,
        transactions: [
          {
            id: 2,
            type: TransactionType.DEPOSIT,
            date: '2026-06-20T12:00:00.000Z',
            value: 50,
          },
        ],
      },
    });

    const result = await store.dispatch(
      submitTransaction({
        userId: 969,
        token: 'token-123',
        payload: {
          type: TransactionType.DEPOSIT,
          value: 50,
          transactionDate: '2026-06-20',
        },
      })
    );

    expect(result).toEqual({ ok: true });
    expect(addTransactionMock).toHaveBeenCalledWith(
      969,
      'token-123',
      expect.objectContaining({ type: TransactionType.DEPOSIT, value: 50 })
    );
    expect(store.getState().account.data.balance).toBe(150);
  });

  it('valida exclusao e edicao usando o estado atual da store', async () => {
    const store = makeDashboardStore();
    store.dispatch(
      accountActions.hydrateAccount({
        balance: 120,
        transactions: [
          {
            id: 1,
            type: TransactionType.DEPOSIT,
            date: '2026-06-20T12:00:00.000Z',
            value: 120,
          },
        ],
      })
    );

    await expect(
      store.dispatch(
        deleteAccountTransaction({
          userId: 969,
          token: 'token-123',
          transactionId: 999,
        })
      )
    ).resolves.toMatchObject({ ok: false, message: expect.stringContaining('nao encontrado') });

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
    ).resolves.toMatchObject({ ok: false, message: expect.stringContaining('nao encontrado') });

    expect(deleteTransactionMock).not.toHaveBeenCalled();
    expect(updateTransactionMock).not.toHaveBeenCalled();
  });
});
