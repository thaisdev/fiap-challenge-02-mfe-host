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
  account: {
    balance: 2500,
    transactions: [
      {
        id: 123,
        type: 'DEPOSIT',
        date: '2026-06-14T19:48:00Z',
        value: 50,
      },
    ],
  },
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

    expect(normalized).not.toBeNull();
    expect(normalized?.token).toBe('mock-token-user-1');
    expect(normalized?.user.id).toBe(969);
    expect(normalized?.user.account.balance).toBe(2500);
    expect(normalized?.user.account.transactions).toHaveLength(8);
    expect(normalized?.user.account.transactions).toEqual(
      expect.arrayContaining([
        {
          id: 123,
          type: 'DEPOSIT',
          date: '2026-06-14T19:48:00Z',
          value: 50,
        },
      ])
    );
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

  it('descarta transacoes invalidas do extrato', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: {
        ...baseUser,
        account: {
          balance: 2500,
          transactions: [
            null,
            { id: 123, type: 'PIX', date: '2026-06-14T19:48:00Z', value: 50 },
            { id: '123', type: 'DEPOSIT', date: '2026-06-14T19:48:00Z', value: 50 },
          ],
        },
      },
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.user.account.transactions).toHaveLength(8);
  });

  it('retorna null quando id do usuario nao e number', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: { ...baseUser, id: 'user-1' },
    });

    expect(normalized).toBeNull();
  });

  it('retorna null quando saldo da conta nao e number', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: { ...baseUser, account: { ...baseUser.account, balance: 'R$ 2.500,00' } },
    });

    expect(normalized).toBeNull();
  });

  it('retorna null quando account esta ausente', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: { id: 969, name: 'Joana', email: 'joana@mail.com' },
    });

    expect(normalized).toBeNull();
  });

  it('usa extrato vazio quando transactions nao e array', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: {
        ...baseUser,
        account: { balance: 2500, transactions: 'invalido' },
      },
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.token).toBe('mock-token-user-1');
    expect(normalized?.user.id).toBe(969);
    expect(normalized?.user.account.balance).toBe(2500);
    expect(normalized?.user.account.transactions).toHaveLength(8);
  });

  it('salva sessao e dispara evento de atualizacao', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const session: AuthSession = {
      token: 'mock-token-user-1',
      user: { ...baseUser, account: { balance: 2500, transactions: [] } },
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
      user: { ...baseUser, account: { balance: 2500, transactions: [] } },
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
      user: { ...baseUser, account: { balance: 2500, transactions: [] } },
    };

    setAuthSession(session);

    expect(setItem).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  });
});
