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

type CapturedContext = ReturnType<typeof useAuthSessionContext>;

const baseSession: AuthSession = {
  token: 'token-123',
  user: {
    id: 969,
    name: 'Joana Silva',
    email: 'joana@mcintoshbank.com.br',
  },
};

function storeSession(session: AuthSession | Record<string, unknown>) {
  window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
}

function Consumer({ onValue }: { onValue: (value: CapturedContext) => void }) {
  const context = useAuthSessionContext();
  onValue(context);

  return <span data-testid="status">{context.status}</span>;
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it('expoe estado unauthenticated quando nao existe sessao', () => {
    renderProvider();

    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
  });

  it('expoe loading durante renderizacao no servidor', () => {
    const html = renderToString(
      <AuthSessionProvider>
        <Consumer onValue={vi.fn()} />
      </AuthSessionProvider>
    );

    expect(html).toContain('loading');
  });

  it('hidrata sessao salva com dados basicos do usuario', () => {
    storeSession(baseSession);
    const onValue = renderProvider();

    const context = onValue.mock.calls.at(-1)?.[0] as CapturedContext;

    expect(context.status satisfies AuthSessionStatus).toBe('authenticated');
    expect(context.session?.user).toEqual({
      id: 969,
      name: 'Joana Silva',
      email: 'joana@mcintoshbank.com.br',
    });
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

  it('normaliza sessao persistida descartando campos extras', () => {
    storeSession({
      token: 'token-legado',
      user: {
        id: 970,
        name: 'Maria Lima',
        email: 'maria@mcintoshbank.com.br',
        account: { balance: 1234.56, transactions: [] },
      },
    });

    renderProvider();

    const stored = JSON.parse(
      window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY) ?? '{}'
    ) as AuthSession;
    expect(stored.user).toEqual({
      id: 970,
      name: 'Maria Lima',
      email: 'maria@mcintoshbank.com.br',
    });
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
