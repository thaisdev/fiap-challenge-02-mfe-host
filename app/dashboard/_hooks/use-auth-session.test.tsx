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
          id: 969,
          name: 'Joana da Silva Oliveira',
          email: 'joana@mail.com',
        },
      })
    );

    const { result } = renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(result.current.status).toBe('authenticated');
    });

    expect(result.current.session?.user.name).toBe('Joana da Silva Oliveira');
    expect(result.current.session?.user.id).toBe(969);
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
          id: 969,
          name: 'Joana da Silva Oliveira',
          email: 'joana@mail.com',
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
          id: 969,
          name: 'Joana da Silva Oliveira',
          email: 'joana@mail.com',
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

  it('persiste sessao normalizada descartando campos extras', async () => {
    sessionStorage.setItem(
      AUTH_SESSION_STORAGE_KEY,
      JSON.stringify({
        token: 'mock-token-user-1',
        user: {
          id: 969,
          name: 'Joana da Silva Oliveira',
          email: 'joana@mail.com',
          account: { balance: 2500, transactions: [] },
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

    expect(normalizedUser).toEqual({
      id: 969,
      name: 'Joana da Silva Oliveira',
      email: 'joana@mail.com',
    });
  });
});
