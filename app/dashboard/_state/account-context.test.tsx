import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountProvider, useAccountContext } from './account-context';
import { TransactionType } from '../_components/interfaces/statement-panel.interfaces';
import { getTransactionDateRange } from '../_utils/transaction-date';
import type { AuthSession } from '@/app/lib/auth-session';

const { fetchAccountByUserIdMock } = vi.hoisted(() => ({
  fetchAccountByUserIdMock: vi.fn(),
}));

vi.mock('@/app/home/_services/auth-service', () => ({
  fetchAccountByUserId: fetchAccountByUserIdMock,
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
    vi.spyOn(Date, 'now').mockReturnValue(123456);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
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
    let context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.balance).toBe(250);
    expect(context.transactions).toHaveLength(2);

    const validDate = getTransactionDateRange().minDate;

    act(() => {
      expect(
        context.onSubmitTransaction({
          type: TransactionType.DEPOSIT,
          value: 30,
          transactionDate: validDate,
        })
      ).toEqual({ ok: true });
    });

    context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.balance).toBe(280);
    expect(context.transactions[0]).toMatchObject({ type: TransactionType.DEPOSIT, value: 30 });

    act(() => {
      context.onDeleteTransaction(2);
    });

    context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.balance).toBe(330);
    expect(context.transactions.some((transaction) => transaction.id === 2)).toBe(false);

    act(() => {
      expect(
        context.onEditTransaction({
          transactionId: 1,
          type: TransactionType.TRANSFER,
          value: 40,
          transactionDate: validDate,
        })
      ).toEqual({ ok: true });
    });

    context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.transactions.find((transaction) => transaction.id === 1)).toMatchObject({
      type: TransactionType.TRANSFER,
      value: 40,
    });
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

  it('retorna mensagens de erro para mutacoes invalidas', async () => {
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

    expect(
      context.onSubmitTransaction({
        type: TransactionType.TRANSFER,
        value: 9999.99,
        transactionDate: validDate,
      })
    ).toMatchObject({ ok: false, message: expect.stringContaining('Saldo insuficiente') });

    expect(
      context.onSubmitTransaction({
        type: TransactionType.DEPOSIT,
        value: 1,
        transactionDate: '1900-01-01',
      })
    ).toMatchObject({ ok: false, message: expect.stringContaining('Data') });

    expect(
      context.onEditTransaction({
        transactionId: 999,
        type: TransactionType.DEPOSIT,
        value: 1,
        transactionDate: validDate,
      })
    ).toMatchObject({ ok: false, message: expect.stringContaining('não encontrado') });

    expect(
      context.onEditTransaction({
        transactionId: 1,
        type: TransactionType.DEPOSIT,
        value: 1,
        transactionDate: '1900-01-01',
      })
    ).toMatchObject({ ok: false, message: expect.stringContaining('Data') });

    expect(
      context.onEditTransaction({
        transactionId: 1,
        type: TransactionType.TRANSFER,
        value: 9999.99,
        transactionDate: validDate,
      })
    ).toMatchObject({ ok: false, message: expect.stringContaining('Saldo insuficiente') });
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
