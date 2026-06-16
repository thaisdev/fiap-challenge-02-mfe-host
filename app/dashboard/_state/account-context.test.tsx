import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountProvider, useAccountContext } from './account-context';
import { TransactionType } from '../_components/interfaces/statement-panel.interfaces';
import { getTransactionDateRange } from '../_utils/transaction-date';
import type { AuthSession } from '@/app/lib/auth-session';

const {
  fetchAccountByUserIdMock,
  addTransactionMock,
  updateTransactionMock,
  deleteTransactionMock,
} = vi.hoisted(() => ({
  fetchAccountByUserIdMock: vi.fn(),
  addTransactionMock: vi.fn(),
  updateTransactionMock: vi.fn(),
  deleteTransactionMock: vi.fn(),
}));

vi.mock('@/app/home/_services/auth-service', () => ({
  fetchAccountByUserId: fetchAccountByUserIdMock,
}));

vi.mock('../_services/transaction-service', () => ({
  addTransaction: addTransactionMock,
  updateTransaction: updateTransactionMock,
  deleteTransaction: deleteTransactionMock,
}));

type CapturedContext = ReturnType<typeof useAccountContext>;

const session: AuthSession = {
  token: 'token-123',
  user: { id: 969, name: 'Joana Silva', email: 'joana@mail.com' },
};

function Consumer({ onValue }: { onValue: (value: CapturedContext) => void }) {
  const context = useAccountContext();
  onValue(context);

  return (
    <div>
      <span data-testid="status">{context.status}</span>
      <span data-testid="balance">{context.balance}</span>
      <span data-testid="entries">{context.transactions.length}</span>
    </div>
  );
}

function renderProvider(onValue = vi.fn()) {
  render(
    <AccountProvider session={session}>
      <Consumer onValue={onValue} />
    </AccountProvider>
  );

  return onValue;
}

describe('AccountProvider', () => {
  beforeEach(() => {
    fetchAccountByUserIdMock.mockReset();
    addTransactionMock.mockReset();
    updateTransactionMock.mockReset();
    deleteTransactionMock.mockReset();
  });

  it('busca a conta da API ao montar e expoe saldo e transacoes', async () => {
    fetchAccountByUserIdMock.mockResolvedValue({
      ok: true,
      account: {
        balance: 250,
        transactions: [
          { id: 1, type: TransactionType.DEPOSIT, date: '2026-04-10T12:00:00.000Z', value: 120 },
          { id: 2, type: TransactionType.TRANSFER, date: '2026-04-11T12:00:00.000Z', value: 50 },
        ],
      },
    });

    const onValue = renderProvider();

    expect(screen.getByTestId('status')).toHaveTextContent('loading');

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
    });

    expect(fetchAccountByUserIdMock).toHaveBeenCalledWith(969, 'token-123');
    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.balance).toBe(250);
    expect(context.transactions).toHaveLength(2);
  });

  it('expoe mensagem de erro quando a busca da conta falha', async () => {
    fetchAccountByUserIdMock.mockResolvedValue({
      ok: false,
      message: 'Token inválido ou expirado',
    });

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('error');
    });
  });

  it('adiciona transacao via API e recarrega a conta pelo GET /account', async () => {
    fetchAccountByUserIdMock
      .mockResolvedValueOnce({
        ok: true,
        account: { balance: 250, transactions: [] },
      })
      .mockResolvedValueOnce({
        ok: true,
        account: {
          balance: 280,
          transactions: [
            { id: 3, type: TransactionType.DEPOSIT, date: '2026-04-10T12:00:00.000Z', value: 30 },
          ],
        },
      });
    addTransactionMock.mockResolvedValue({ ok: true });

    const onValue = renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
    });

    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    const validDate = getTransactionDateRange().minDate;

    let result;
    await act(async () => {
      result = await context.onSubmitTransaction({
        type: TransactionType.DEPOSIT,
        value: 30,
        transactionDate: validDate,
      });
    });

    expect(result).toEqual({ ok: true });
    expect(addTransactionMock).toHaveBeenCalledWith(
      969,
      'token-123',
      expect.objectContaining({ type: TransactionType.DEPOSIT, value: 30 })
    );
    expect(fetchAccountByUserIdMock).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      const updatedContext = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
      expect(updatedContext.balance).toBe(280);
      expect(updatedContext.transactions).toHaveLength(1);
    });
  });

  it('nao recarrega a conta quando a API recusa a nova transacao', async () => {
    fetchAccountByUserIdMock.mockResolvedValue({
      ok: true,
      account: { balance: 250, transactions: [] },
    });
    addTransactionMock.mockResolvedValue({ ok: false, message: 'Usuário não encontrado' });

    const onValue = renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
    });

    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    const validDate = getTransactionDateRange().minDate;

    let result;
    await act(async () => {
      result = await context.onSubmitTransaction({
        type: TransactionType.DEPOSIT,
        value: 30,
        transactionDate: validDate,
      });
    });

    expect(result).toEqual({ ok: false, message: 'Usuário não encontrado' });
    expect(fetchAccountByUserIdMock).toHaveBeenCalledTimes(1);
  });

  it('exclui transacao via API e recarrega a conta', async () => {
    fetchAccountByUserIdMock
      .mockResolvedValueOnce({
        ok: true,
        account: {
          balance: 250,
          transactions: [
            { id: 1, type: TransactionType.DEPOSIT, date: '2026-04-10T12:00:00.000Z', value: 120 },
          ],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        account: { balance: 130, transactions: [] },
      });
    deleteTransactionMock.mockResolvedValue({ ok: true });

    const onValue = renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
    });

    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;

    let result;
    await act(async () => {
      result = await context.onDeleteTransaction(1);
    });

    expect(result).toEqual({ ok: true });
    expect(deleteTransactionMock).toHaveBeenCalledWith(969, 'token-123', 1);
    expect(fetchAccountByUserIdMock).toHaveBeenCalledTimes(2);

    await waitFor(() => {
      const updatedContext = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
      expect(updatedContext.balance).toBe(130);
      expect(updatedContext.transactions).toHaveLength(0);
    });
  });

  it('propaga mensagem de erro quando a exclusao falha na API', async () => {
    fetchAccountByUserIdMock.mockResolvedValue({
      ok: true,
      account: {
        balance: 250,
        transactions: [
          { id: 1, type: TransactionType.DEPOSIT, date: '2026-04-10T12:00:00.000Z', value: 120 },
        ],
      },
    });
    deleteTransactionMock.mockResolvedValue({ ok: false, message: 'Transação não encontrada' });

    const onValue = renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
    });

    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;

    let result;
    await act(async () => {
      result = await context.onDeleteTransaction(1);
    });

    expect(result).toEqual({ ok: false, message: 'Transação não encontrada' });
    expect(fetchAccountByUserIdMock).toHaveBeenCalledTimes(1);
  });

  it('edita transacao via API e recarrega a conta', async () => {
    fetchAccountByUserIdMock
      .mockResolvedValueOnce({
        ok: true,
        account: {
          balance: 250,
          transactions: [
            { id: 1, type: TransactionType.DEPOSIT, date: '2026-04-10T12:00:00.000Z', value: 120 },
          ],
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        account: {
          balance: 210,
          transactions: [
            { id: 1, type: TransactionType.TRANSFER, date: '2026-04-10T12:00:00.000Z', value: 40 },
          ],
        },
      });
    updateTransactionMock.mockResolvedValue({ ok: true });

    const onValue = renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
    });

    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    const validDate = getTransactionDateRange().minDate;

    let result;
    await act(async () => {
      result = await context.onEditTransaction({
        transactionId: 1,
        type: TransactionType.TRANSFER,
        value: 40,
        transactionDate: validDate,
      });
    });

    expect(result).toEqual({ ok: true });
    expect(updateTransactionMock).toHaveBeenCalledWith(
      969,
      'token-123',
      1,
      expect.objectContaining({ type: TransactionType.TRANSFER, value: 40 })
    );
    expect(fetchAccountByUserIdMock).toHaveBeenCalledTimes(2);
  });

  it('retorna mensagens de erro para mutacoes invalidas sem chamar a API', async () => {
    fetchAccountByUserIdMock.mockResolvedValue({
      ok: true,
      account: {
        balance: 250,
        transactions: [
          { id: 1, type: TransactionType.DEPOSIT, date: '2026-04-10T12:00:00.000Z', value: 120 },
        ],
      },
    });

    const onValue = renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('ready');
    });

    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    const validDate = getTransactionDateRange().minDate;

    await expect(
      context.onSubmitTransaction({
        type: TransactionType.TRANSFER,
        value: 9999.99,
        transactionDate: validDate,
      })
    ).resolves.toMatchObject({ ok: false, message: expect.stringContaining('Saldo insuficiente') });

    await expect(
      context.onSubmitTransaction({
        type: TransactionType.DEPOSIT,
        value: 1,
        transactionDate: '1900-01-01',
      })
    ).resolves.toMatchObject({ ok: false, message: expect.stringContaining('Data') });

    await expect(
      context.onEditTransaction({
        transactionId: 999,
        type: TransactionType.DEPOSIT,
        value: 1,
        transactionDate: validDate,
      })
    ).resolves.toMatchObject({ ok: false, message: expect.stringContaining('não encontrado') });

    await expect(
      context.onEditTransaction({
        transactionId: 1,
        type: TransactionType.DEPOSIT,
        value: 1,
        transactionDate: '1900-01-01',
      })
    ).resolves.toMatchObject({ ok: false, message: expect.stringContaining('Data') });

    await expect(
      context.onEditTransaction({
        transactionId: 1,
        type: TransactionType.TRANSFER,
        value: 9999.99,
        transactionDate: validDate,
      })
    ).resolves.toMatchObject({ ok: false, message: expect.stringContaining('Saldo insuficiente') });

    expect(addTransactionMock).not.toHaveBeenCalled();
    expect(updateTransactionMock).not.toHaveBeenCalled();
  });

  it('ignora resposta da busca quando o componente e desmontado antes da resolucao', async () => {
    let resolveFetch!: (value: { ok: true; account: { balance: number; transactions: never[] } }) => void;
    fetchAccountByUserIdMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { unmount } = render(
      <AccountProvider session={session}>
        <Consumer onValue={vi.fn()} />
      </AccountProvider>
    );
    unmount();

    resolveFetch({ ok: true, account: { balance: 999, transactions: [] } });
    await Promise.resolve();
  });
});

describe('useAccountContext', () => {
  it('falha quando usado fora do AccountProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    function InvalidConsumer() {
      useAccountContext();
      return null;
    }

    expect(() => render(<InvalidConsumer />)).toThrow(
      'useAccountContext must be used within an AccountProvider'
    );
    consoleErrorSpy.mockRestore();
  });
});
