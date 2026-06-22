import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAccountByUserId, loginAccount, registerAccount } from './auth-service';

describe('auth-service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('registerAccount', () => {
    it('envia cadastro para api/users e usa fallback de sucesso quando a API nao retorna mensagem', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 969,
          name: 'Maria',
          email: 'maria@mail.com',
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await registerAccount({
        name: 'Maria',
        email: 'maria@mail.com',
        password: '123456',
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/users', {
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

      const result = await registerAccount({
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

      const result = await registerAccount({
        name: 'Maria',
        email: 'maria@mail.com',
        password: '123456',
      });

      expect(fetchMock).toHaveBeenCalledWith('/api/users', {
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
  });

  describe('loginAccount', () => {
    it('ignora mensagem vazia da API no login e usa fallback', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: '   ' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await loginAccount({
        email: 'maria@mail.com',
        password: '123456',
      });

      expect(result).toEqual({
        ok: false,
        message: 'Nao foi possivel autenticar. Revise seus dados.',
      });
    });

    it('retorna token e dados basicos do usuario quando login e valido', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: 'Login realizado com sucesso.',
          token: 'mock-token-user-1',
          user: {
            id: 969,
            name: 'Joana',
            email: 'joana@mail.com',
          },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await loginAccount({
        email: 'joana@mail.com',
        password: '123456',
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith('/api/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          email: 'joana@mail.com',
          password: '123456',
        }),
      });
      expect(result).toEqual({
        ok: true,
        message: 'Login realizado com sucesso.',
        token: 'mock-token-user-1',
        user: {
          id: 969,
          name: 'Joana',
          email: 'joana@mail.com',
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

      const result = await loginAccount({
        email: 'joana@mail.com',
        password: '123456',
      });

      expect(result).toEqual({
        ok: false,
        message: 'Login realizado com sucesso.',
      });
    });

    it('retorna falha quando login nao retorna dados do usuario', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          message: 'Login realizado com sucesso.',
          token: 'mock-token-user-1',
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await loginAccount({
        email: 'joana@mail.com',
        password: '123456',
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ok: false,
        message: 'Login realizado com sucesso.',
      });
    });

    it('retorna erro de conexao quando fetch falha', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('network error'));
      vi.stubGlobal('fetch', fetchMock);

      const result = await loginAccount({
        email: 'maria@mail.com',
        password: '123456',
      });

      expect(result).toEqual({
        ok: false,
        message: 'Erro de conexao. Tente novamente em instantes.',
      });
    });
  });

  describe('fetchAccountByUserId', () => {
    it('retorna a conta quando a API responde com sucesso', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          balance: 2500,
          transactions: [
            {
              id: 123,
              type: 'DEPOSIT',
              date: '2026-06-14T19:48:00Z',
              value: 100,
            },
          ],
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchAccountByUserId(969, 'mock-token-user-1');

      expect(fetchMock).toHaveBeenCalledWith('/api/users/969/account', {
        headers: {
          Authorization: 'Bearer mock-token-user-1',
        },
      });
      expect(result).toEqual({
        ok: true,
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
      });
    });

    it('retorna falha quando a conta retorna 404 de usuario nao encontrado', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Usuário não encontrado' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchAccountByUserId(969, 'mock-token-user-1');

      expect(result).toEqual({
        ok: false,
        message: 'Usuário não encontrado',
      });
    });

    it('retorna falha quando a conta retorna 401 de token invalido', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Token inválido ou expirado' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchAccountByUserId(969, 'mock-token-user-1');

      expect(result).toEqual({
        ok: false,
        message: 'Token inválido ou expirado',
      });
    });

    it('retorna falha quando a conta vem com corpo invalido', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(null),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchAccountByUserId(969, 'mock-token-user-1');

      expect(result).toEqual({
        ok: false,
        message: 'Nao foi possivel autenticar. Revise seus dados.',
      });
    });

    it('retorna falha quando a conta vem com extrato invalido', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          balance: 2500,
          transactions: [123],
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchAccountByUserId(969, 'mock-token-user-1');

      expect(result).toEqual({
        ok: false,
        message: 'Nao foi possivel autenticar. Revise seus dados.',
      });
    });

    it('retorna erro de conexao quando fetch falha', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('network error'));
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchAccountByUserId(969, 'mock-token-user-1');

      expect(result).toEqual({
        ok: false,
        message: 'Erro de conexao. Tente novamente em instantes.',
      });
    });
  });
});
