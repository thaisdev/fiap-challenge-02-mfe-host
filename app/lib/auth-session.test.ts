import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_SESSION_CHANGED_EVENT,
  AUTH_SESSION_STORAGE_KEY,
  clearAuthSession,
  normalizeAuthSession,
  parseAuthSession,
  setAuthSession,
  type AuthSession,
} from './auth-session';

const baseUser = {
  id: 969,
  name: 'Joana da Silva Oliveira',
  email: 'joana@mail.com',
};

describe('auth-session', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('normaliza sessao no formato atual', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: baseUser,
    });

    expect(normalized).toEqual({
      token: 'mock-token-user-1',
      user: baseUser,
    });
  });

  it('retorna null quando json da sessao e invalido', () => {
    expect(parseAuthSession('{json-invalido}')).toBeNull();
  });

  it('retorna null quando nao recebe sessao serializada', () => {
    expect(parseAuthSession(null)).toBeNull();
  });

  it('retorna null para payload fora do formato mínimo esperado', () => {
    expect(normalizeAuthSession({})).toBeNull();
  });

  it('retorna null quando token nao e string', () => {
    expect(normalizeAuthSession({ token: 123, user: baseUser })).toBeNull();
  });

  it('retorna null quando id do usuario nao e number', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: { ...baseUser, id: 'user-1' },
    });

    expect(normalized).toBeNull();
  });

  it('retorna null quando name ou email do usuario nao sao string', () => {
    expect(
      normalizeAuthSession({ token: 'mock-token-user-1', user: { ...baseUser, name: 1 } })
    ).toBeNull();
    expect(
      normalizeAuthSession({ token: 'mock-token-user-1', user: { ...baseUser, email: 1 } })
    ).toBeNull();
  });

  it('ignora campos extras do usuario ao normalizar', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: { ...baseUser, account: { balance: 2500, transactions: [] } },
    });

    expect(normalized).toEqual({
      token: 'mock-token-user-1',
      user: baseUser,
    });
  });

  it('salva sessao e dispara evento de atualizacao', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const session: AuthSession = {
      token: 'mock-token-user-1',
      user: baseUser,
    };

    setAuthSession(session);

    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toEqual(JSON.stringify(session));
    expect(dispatchSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchSpy.mock.calls.at(-1)?.[0];
    expect(dispatchedEvent).toBeInstanceOf(Event);
    expect((dispatchedEvent as Event).type).toBe(AUTH_SESSION_CHANGED_EVENT);
  });

  it('limpa sessao e dispara evento de atualizacao', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ token: 'x', user: {} }));

    clearAuthSession();

    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
    expect(dispatchSpy).toHaveBeenCalled();
    const dispatchedEvent = dispatchSpy.mock.calls.at(-1)?.[0];
    expect(dispatchedEvent).toBeInstanceOf(Event);
    expect((dispatchedEvent as Event).type).toBe(AUTH_SESSION_CHANGED_EVENT);
  });

  it('nao tenta salvar sessao quando window nao existe', () => {
    vi.stubGlobal('window', undefined);

    const session: AuthSession = {
      token: 'mock-token-user-1',
      user: baseUser,
    };

    expect(() => setAuthSession(session)).not.toThrow();
  });

  it('nao tenta limpar sessao quando window nao existe', () => {
    vi.stubGlobal('window', undefined);

    expect(() => clearAuthSession()).not.toThrow();
  });

  it('interrompe o dispatch quando window fica indisponivel durante o set', () => {
    const originalWindow = window;
    const setItem = vi.fn(() => {
      vi.stubGlobal('window', undefined);
    });

    vi.stubGlobal('window', {
      ...originalWindow,
      sessionStorage: {
        setItem,
      },
    });

    const session: AuthSession = {
      token: 'mock-token-user-1',
      user: baseUser,
    };

    setAuthSession(session);

    expect(setItem).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  });
});
