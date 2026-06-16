import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthSessionProvider,
  useAuthSessionContext,
  type AuthSessionStatus,
} from './auth-session-context';
import {
  AUTH_SESSION_CHANGED_EVENT,
  AUTH_SESSION_STORAGE_KEY,
  type AuthSession,
} from '../lib/auth-session';
import {
  StatementEntryType,
  TransactionType,
} from '../dashboard/_components/interfaces/statement-panel.interfaces';
import { getTransactionDateRange } from '../dashboard/_utils/transaction-date';

type CapturedContext = ReturnType<typeof useAuthSessionContext>;

const baseSession: AuthSession = {
  token: 'token-123',
  user: {
    id: 'user-1',
    name: 'Joana Silva',
    email: 'joana@mcintoshbank.com.br',
    createdAt: '2026-04-01T12:00:00.000Z',
    accountBalance: 250,
    statementEntries: [
      {
        id: 'entry-1',
        month: 'Abril',
        type: StatementEntryType.DEPOSIT,
        amountInCents: 12000,
        date: '10/04/2026',
      },
      {
        id: 'entry-2',
        month: 'Abril',
        type: StatementEntryType.TRANSFER,
        amountInCents: -5000,
        date: '11/04/2026',
      },
    ],
  },
};

function storeSession(session: AuthSession | Record<string, unknown>) {
  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function Consumer({ onValue }: { onValue: (value: CapturedContext) => void }) {
  const context = useAuthSessionContext();
  onValue(context);

  return (
    <div>
      <span data-testid="status">{context.status}</span>
      <span data-testid="balance">{context.balance}</span>
      <span data-testid="entries">{context.statementEntries.length}</span>
    </div>
  );
}

function renderProvider(onValue = vi.fn()) {
  render(
    <AuthSessionProvider>
      <Consumer onValue={onValue} />
    </AuthSessionProvider>
  );

  return onValue;
}

function RerenderingProvider({ onValue }: { onValue: (value: CapturedContext) => void }) {
  const [renderCount, setRenderCount] = useState(0);

  return (
    <div>
      <button type="button" onClick={() => setRenderCount((current) => current + 1)}>
        Renderizar novamente {renderCount}
      </button>
      <AuthSessionProvider>
        <Consumer onValue={onValue} />
      </AuthSessionProvider>
    </div>
  );
}

describe('AuthSessionProvider', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('entry-random-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('expoe estado unauthenticated quando nao existe sessao', () => {
    renderProvider();

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    expect(screen.getByTestId('balance')).toHaveTextContent('0');
    expect(screen.getByTestId('entries')).toHaveTextContent('0');
  });

  it('expoe loading durante renderizacao no servidor', () => {
    const html = renderToString(
      <AuthSessionProvider>
        <Consumer onValue={vi.fn()} />
      </AuthSessionProvider>
    );

    expect(html).toContain('loading');
  });

  it('hidrata sessao salva e atualiza extrato com mutacoes validas', () => {
    storeSession(baseSession);
    const onValue = renderProvider();

    let context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    const validDate = getTransactionDateRange().minDate;

    expect(context.status satisfies AuthSessionStatus).toBe('authenticated');
    expect(context.session?.user.name).toBe('Joana Silva');
    expect(context.balance).toBe(250);
    expect(context.statementEntries.length).toBeGreaterThanOrEqual(2);

    act(() => {
      expect(
        context.onSubmitTransaction({
          type: TransactionType.DEPOSIT,
          amountInCents: 3000,
          transactionDate: validDate,
        })
      ).toEqual({ ok: true });
    });

    context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.balance).toBe(280);
    expect(context.statementEntries[0]).toMatchObject({
      id: 'entry-random-id',
      type: StatementEntryType.DEPOSIT,
      amountInCents: 3000,
    });

    act(() => {
      expect(
        context.onSubmitTransaction({
          type: TransactionType.TRANSFER,
          amountInCents: 1000,
          transactionDate: validDate,
        })
      ).toEqual({ ok: true });
    });

    context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.statementEntries[0]).toMatchObject({
      type: StatementEntryType.TRANSFER,
      amountInCents: -1000,
    });

    act(() => {
      context.onDeleteStatementEntry('entry-2');
    });

    context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.balance).toBe(320);
    expect(context.statementEntries.some((entry) => entry.id === 'entry-2')).toBe(false);

    act(() => {
      expect(
        context.onEditStatementEntry({
          entryId: 'entry-1',
          type: TransactionType.TRANSFER,
          amountInCents: 4000,
          transactionDate: validDate,
        })
      ).toEqual({ ok: true });
    });

    context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.statementEntries.find((entry) => entry.id === 'entry-1')).toMatchObject({
      type: StatementEntryType.TRANSFER,
      amountInCents: -4000,
    });

    act(() => {
      expect(
        context.onEditStatementEntry({
          entryId: 'entry-1',
          type: TransactionType.DEPOSIT,
          amountInCents: 4000,
          transactionDate: validDate,
        })
      ).toEqual({ ok: true });
    });

    context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.statementEntries.find((entry) => entry.id === 'entry-1')).toMatchObject({
      type: StatementEntryType.DEPOSIT,
      amountInCents: 4000,
    });
  });

  it('hidrata sessao sem lancamentos usando lista vazia como fallback', () => {
    const sessionWithoutEntries = {
      ...baseSession,
      user: {
        ...baseSession.user,
        statementEntries: undefined,
      },
    };
    storeSession(sessionWithoutEntries);

    renderProvider();

    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    expect(screen.getByTestId('entries')).toHaveTextContent('8');
  });

  it('cria lancamento com fallback quando randomUUID nao esta disponivel', () => {
    storeSession(baseSession);
    vi.spyOn(Date, 'now').mockReturnValue(123456);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    Object.defineProperty(crypto, 'randomUUID', {
      value: undefined,
      configurable: true,
    });

    const onValue = renderProvider();
    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;

    act(() => {
      expect(
        context.onSubmitTransaction({
          type: TransactionType.DEPOSIT,
          amountInCents: 1000,
          transactionDate: getTransactionDateRange().minDate,
        })
      ).toEqual({ ok: true });
    });

    const updatedContext = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(updatedContext.statementEntries[0].id).toContain('entry-123456-');
  });

  it('retorna mensagens de erro para mutacoes invalidas', () => {
    storeSession(baseSession);
    const onValue = renderProvider();
    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    const validDate = getTransactionDateRange().minDate;

    expect(
      context.onSubmitTransaction({
        type: TransactionType.TRANSFER,
        amountInCents: 999999,
        transactionDate: validDate,
      })
    ).toMatchObject({ ok: false, message: expect.stringContaining('Saldo insuficiente') });

    expect(
      context.onSubmitTransaction({
        type: TransactionType.DEPOSIT,
        amountInCents: 100,
        transactionDate: '1900-01-01',
      })
    ).toMatchObject({ ok: false, message: expect.stringContaining('Data') });

    expect(
      context.onEditStatementEntry({
        entryId: 'inexistente',
        type: TransactionType.DEPOSIT,
        amountInCents: 100,
        transactionDate: validDate,
      })
    ).toMatchObject({ ok: false, message: expect.stringContaining('não encontrado') });

    expect(
      context.onEditStatementEntry({
        entryId: 'entry-1',
        type: TransactionType.DEPOSIT,
        amountInCents: 100,
        transactionDate: '1900-01-01',
      })
    ).toMatchObject({ ok: false, message: expect.stringContaining('Data') });

    expect(
      context.onEditStatementEntry({
        entryId: 'entry-1',
        type: TransactionType.TRANSFER,
        amountInCents: 999999,
        transactionDate: validDate,
      })
    ).toMatchObject({ ok: false, message: expect.stringContaining('Saldo insuficiente') });
  });

  it('reage ao evento de mudanca da sessao', () => {
    const onValue = renderProvider();

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');

    act(() => {
      storeSession(baseSession);
      window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
    });

    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.status).toBe('authenticated');
    expect(screen.getByTestId('balance')).toHaveTextContent('250');
  });

  it('reage apenas a storage events da sessao autenticada', () => {
    const onValue = renderProvider();
    const initialCallCount = onValue.mock.calls.length;

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'outra-chave',
          storageArea: window.sessionStorage,
        })
      );
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: AUTH_SESSION_STORAGE_KEY,
          storageArea: window.localStorage,
        })
      );
    });

    expect(onValue).toHaveBeenCalledTimes(initialCallCount);

    act(() => {
      storeSession(baseSession);
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: AUTH_SESSION_STORAGE_KEY,
          storageArea: window.sessionStorage,
        })
      );
    });

    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;
    expect(context.status).toBe('authenticated');
  });

  it('ignora hidratacao repetida do mesmo snapshot', () => {
    storeSession(baseSession);
    const onValue = vi.fn();
    render(<RerenderingProvider onValue={onValue} />);
    const callCountAfterHydration = onValue.mock.calls.length;

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /renderizar novamente/i }));
    });

    expect(onValue.mock.calls.length).toBeGreaterThan(callCountAfterHydration);
    expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
  });

  it('normaliza sessao persistida quando snapshot esta em formato legado', () => {
    storeSession({
      token: 'token-legado',
      user: {
        id: 'user-2',
        name: 'Maria Lima',
        email: 'maria@mcintoshbank.com.br',
        createdAt: '2026-04-01T12:00:00.000Z',
        accountBalance: 'R$ 1.234,56',
        statementEntries: [],
      },
    });

    renderProvider();

    const stored = JSON.parse(
      window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY) ?? '{}'
    ) as AuthSession;
    expect(stored.user.accountBalance).toBe(1234.56);
    expect(stored.user.statementEntries.length).toBeGreaterThan(0);
  });
});

describe('useAuthSessionContext', () => {
  it('falha quando usado fora do AuthSessionProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    function InvalidConsumer() {
      useAuthSessionContext();
      return null;
    }

    expect(() => render(<InvalidConsumer />)).toThrow(
      'useAuthSessionContext must be used within an AuthSessionProvider'
    );
    consoleErrorSpy.mockRestore();
  });
});
