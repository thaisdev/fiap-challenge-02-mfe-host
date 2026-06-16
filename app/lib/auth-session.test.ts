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

describe('auth-session', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('normaliza sessao no formato atual', () => {
    const normalized = normalizeAuthSession({
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
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.token).toBe('mock-token-user-1');
    expect(normalized?.user.id).toBe('user-1');
    expect(normalized?.user.accountBalance).toBe(2500);
    expect(normalized?.user.statementEntries).toHaveLength(8);
    expect(normalized?.user.statementEntries).toEqual(
      expect.arrayContaining([
        {
          id: 'entry-1',
          month: 'Novembro',
          type: 'Deposito',
          amountInCents: 5000,
          date: '21/11/2022',
        },
      ])
    );
  });

  it('normaliza sessao legado com saldo e extrato em string', () => {
    const parsed = parseAuthSession(
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
            {
              id: 'entry-2',
              month: 'Novembro',
              type: 'Transferencia',
              value: '-R$ 500',
              date: '21/11/2022',
            },
          ],
        },
      })
    );

    expect(parsed?.user.accountBalance).toBe(2500);
    expect(parsed?.user.statementEntries).toHaveLength(8);
    expect(parsed?.user.statementEntries).toEqual(
      expect.arrayContaining([
        {
          id: 'entry-1',
          month: 'Novembro',
          type: 'Deposito',
          amountInCents: 5000,
          date: '21/11/2022',
        },
        {
          id: 'entry-2',
          month: 'Novembro',
          type: 'Transferencia',
          amountInCents: -50000,
          date: '21/11/2022',
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

  it('descarta entradas invalidas e rejeita saldo legado invalido', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: {
        id: 'user-1',
        name: 'Joana da Silva Oliveira',
        email: 'joana@mail.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        accountBalance: 'R$ valor-invalido',
        statementEntries: [
          null,
          { id: 'entry-1', month: 'Novembro', type: 'Deposito', value: 5000, date: '21/11/2022' },
        ],
      },
    });

    expect(normalized).toBeNull();
  });

  it('retorna null quando saldo nao e number nem string', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: {
        id: 'user-1',
        name: 'Joana da Silva Oliveira',
        email: 'joana@mail.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        accountBalance: true,
        statementEntries: [],
      },
    });

    expect(normalized).toBeNull();
  });

  it('usa extrato vazio quando statementEntries nao e array', () => {
    const normalized = normalizeAuthSession({
      token: 'mock-token-user-1',
      user: {
        id: 'user-1',
        name: 'Joana da Silva Oliveira',
        email: 'joana@mail.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        accountBalance: 2500,
        statementEntries: 'invalido',
      },
    });

    expect(normalized).not.toBeNull();
    expect(normalized?.token).toBe('mock-token-user-1');
    expect(normalized?.user.id).toBe('user-1');
    expect(normalized?.user.accountBalance).toBe(2500);
    expect(normalized?.user.statementEntries).toHaveLength(8);
  });

  it('salva sessao e dispara evento de atualizacao', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    const session: AuthSession = {
      token: 'mock-token-user-1',
      user: {
        id: 'user-1',
        name: 'Joana da Silva Oliveira',
        email: 'joana@mail.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        accountBalance: 2500,
        statementEntries: [],
      },
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
      user: {
        id: 'user-1',
        name: 'Joana da Silva Oliveira',
        email: 'joana@mail.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        accountBalance: 2500,
        statementEntries: [],
      },
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
      user: {
        id: 'user-1',
        name: 'Joana da Silva Oliveira',
        email: 'joana@mail.com',
        createdAt: '2026-01-01T00:00:00.000Z',
        accountBalance: 2500,
        statementEntries: [],
      },
    };

    setAuthSession(session);

    expect(setItem).toHaveBeenCalledWith(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  });
});
