import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginMockAccount, registerMockAccount } from './auth-service';

describe('auth-service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('envia cadastro para http://localhost:3333/users e usa fallback de sucesso quando a API nao retorna mensagem', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        id: 969,
        name: 'Maria',
        email: 'maria@mail.com',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await registerMockAccount({
      name: 'Maria',
      email: 'maria@mail.com',
      password: '123456',
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3333/users', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Maria',
        email: 'maria@mail.com',
        password: '123456',
      }),
    });
    expect(result).toEqual({
      ok: true,
      message: 'Usuario criado com sucesso.',
    });
  });

  it('usa fallback de sucesso quando response.json falha', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new Error('sem json')),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await registerMockAccount({
      name: 'Maria',
      email: 'maria@mail.com',
      password: '123456',
    });

    expect(result).toEqual({
      ok: true,
      message: 'Usuario criado com sucesso.',
    });
  });

  it('usa fallback de erro quando API nao manda mensagem', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({}),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await registerMockAccount({
      name: 'Maria',
      email: 'maria@mail.com',
      password: '123456',
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3333/users', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Maria',
        email: 'maria@mail.com',
        password: '123456',
      }),
    });
    expect(result).toEqual({
      ok: false,
      message: 'Nao foi possivel criar a conta. Tente novamente.',
    });
  });

  it('ignora mensagem vazia da API no login e usa fallback', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: vi.fn().mockResolvedValue({ message: '   ' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loginMockAccount({
      email: 'maria@mail.com',
      password: '123456',
    });

    expect(result).toEqual({
      ok: false,
      message: 'Nao foi possivel autenticar. Revise seus dados.',
    });
  });

  it('retorna token e usuario quando login vem valido da API', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: 'Login realizado com sucesso.',
          token: 'mock-token-user-1',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          users: [
            {
              id: 969,
              name: 'Joana',
              email: 'joana@mail.com',
              account: {
                balance: 2500,
                transactions: [
                  {
                    id: 123,
                    type: 'DEPOSIT',
                    date: '2026-06-14T19:48:00Z',
                    value: 100,
                  },
                ],
              },
            },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loginMockAccount({
      email: 'joana@mail.com',
      password: '123456',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3333/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'joana@mail.com',
        password: '123456',
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/mock/users');
    expect(result).toEqual({
      ok: true,
      message: 'Login realizado com sucesso.',
      token: 'mock-token-user-1',
      user: {
        id: 969,
        name: 'Joana',
        email: 'joana@mail.com',
        account: {
          balance: 2500,
          transactions: [
            {
              id: 123,
              type: 'DEPOSIT',
              date: '2026-06-14T19:48:00Z',
              value: 100,
            },
          ],
        },
      },
    });
  });

  it('retorna falha quando login 200 nao traz token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        message: 'Login realizado com sucesso.',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loginMockAccount({
      email: 'joana@mail.com',
      password: '123456',
    });

    expect(result).toEqual({
      ok: false,
      message: 'Login realizado com sucesso.',
    });
  });

  it('retorna falha quando usuario nao eh encontrado apos login bem sucedido', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: 'Login realizado com sucesso.',
          token: 'mock-token-user-1',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          users: [null],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loginMockAccount({
      email: 'joana@mail.com',
      password: '123456',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3333/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'joana@mail.com',
        password: '123456',
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/mock/users');
    expect(result).toEqual({
      ok: false,
      message: 'Nao foi possivel autenticar. Revise seus dados.',
    });
  });

  it('retorna falha quando extrato contem item invalido', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: 'Login realizado com sucesso.',
          token: 'mock-token-user-1',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          users: [
            {
              id: 969,
              name: 'Joana',
              email: 'joana@mail.com',
              account: {
                balance: 2500,
                transactions: [123],
              },
            },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await loginMockAccount({
      email: 'joana@mail.com',
      password: '123456',
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:3333/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'joana@mail.com',
        password: '123456',
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/mock/users');
    expect(result).toEqual({
      ok: false,
      message: 'Nao foi possivel autenticar. Revise seus dados.',
    });
  });

  it('retorna erro de conexao quando fetch falha', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network error'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await loginMockAccount({
      email: 'maria@mail.com',
      password: '123456',
    });

    expect(result).toEqual({
      ok: false,
      message: 'Erro de conexao. Tente novamente em instantes.',
    });
  });
});
