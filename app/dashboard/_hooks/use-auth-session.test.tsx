import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_SESSION_CHANGED_EVENT, AUTH_SESSION_STORAGE_KEY } from '@/app/lib/auth-session';
import { useAuthSession } from './use-auth-session';

describe('useAuthSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna estado unauthenticated quando sessao nao existe', async () => {
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    expect(result.current.session).toBeNull();
  });

  it('retorna sessao autenticada quando json salvo e valido', async () => {
    sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        token: 'mock-token-user-1',
        user: {
          id: 'user-1',
          name: 'Joana da Silva Oliveira',
          email: 'joana@mail.com',
          createdAt: '2026-01-01T00:00:00.000Z',
          accountBalance: 2500,
          statementEntries: [
            {
              id: 'entry-1',
              month: 'Novembro',
              type: 'Deposito',
              amountInCents: 5000,
              date: '21/11/2022',
            },
          ],
        },
      })
    );

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(result.current.session?.user.name).toBe('Joana da Silva Oliveira');
    expect(result.current.session?.user.accountBalance).toBe(2500);
  });

  it('retorna unauthenticated quando json salvo esta invalido', async () => {
    sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, '{json-invalido}');

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    expect(result.current.session).toBeNull();
  });

  it('atualiza estado quando recebe storage event da sessao', async () => {
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        token: 'mock-token-user-1',
        user: {
          id: 'user-1',
          name: 'Joana da Silva Oliveira',
          email: 'joana@mail.com',
          createdAt: '2026-01-01T00:00:00.000Z',
          accountBalance: 2500,
          statementEntries: [],
        },
      })
    );

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: AUTH_SESSION_STORAGE_KEY,
          storageArea: window.sessionStorage,
        })
      );
    });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });
  });

  it('ignora storage event de outra chave e de outro storage', async () => {
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'outra-chave',
          storageArea: window.sessionStorage,
        })
      );
    });

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: AUTH_SESSION_STORAGE_KEY,
          storageArea: window.localStorage,
        })
      );
    });

    expect(result.current.status).toBe('unauthenticated');
  });

  it('atualiza estado quando recebe evento interno de mudanca de sessao', async () => {
    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('unauthenticated');
    });

    sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        token: 'mock-token-user-1',
        user: {
          id: 'user-1',
          name: 'Joana da Silva Oliveira',
          email: 'joana@mail.com',
          createdAt: '2026-01-01T00:00:00.000Z',
          accountBalance: 2500,
          statementEntries: [],
        },
      })
    );

    act(() => {
      window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
    });

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });
  });

  it('normaliza sessao legado e persiste no formato atual', async () => {
    sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        token: 'mock-token-user-1',
        user: {
          id: 'user-1',
          name: 'Joana da Silva Oliveira',
          email: 'joana@mail.com',
          createdAt: '2026-01-01T00:00:00.000Z',
          accountBalance: 'R$ 2.500,00',
          statementEntries: [
            {
              id: 'entry-1',
              month: 'Novembro',
              type: 'Deposito',
              value: 'R$ 50',
              date: '21/11/2022',
            },
          ],
        },
      })
    );

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    const normalizedSession = JSON.parse(
      sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY) ?? '{}'
    ) as Record<string, unknown>;
    const normalizedUser = normalizedSession.user as Record<string, unknown>;

    expect(normalizedUser.accountBalance).toBe(2500);
  });
});
