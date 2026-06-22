import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  addTransaction,
  deleteTransaction,
  fetchFinancialSummary,
  fetchTransactions,
  updateTransaction,
} from './transaction-service';
import { TransactionType } from '../_components/interfaces/transaction.interfaces';

const payload = {
  id: 789,
  type: TransactionType.DEPOSIT,
  date: '2026-06-14T19:48:00Z',
  value: 6000,
};

describe('transaction-service', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('addTransaction', () => {
    it('envia POST para /users/:id/account/transactions com o payload e token', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn() });
      vi.stubGlobal('fetch', fetchMock);

      const result = await addTransaction(969, 'token-123', payload);

      expect(fetchMock).toHaveBeenCalledWith('/api/users/969/account/transactions', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-123',
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      expect(result).toEqual({ ok: true });
    });

    it('retorna mensagem de erro quando a API responde 400', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Campos obrigatórios ausentes' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await addTransaction(969, 'token-123', payload);

      expect(result).toEqual({ ok: false, message: 'Campos obrigatórios ausentes' });
    });

    it('usa mensagem de fallback quando a API nao retorna mensagem', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({}),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await addTransaction(969, 'token-123', payload);

      expect(result).toEqual({
        ok: false,
        message: 'Não foi possível concluir a operação. Tente novamente.',
      });
    });

    it('retorna erro de conexao quando fetch falha', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('network error'));
      vi.stubGlobal('fetch', fetchMock);

      const result = await addTransaction(969, 'token-123', payload);

      expect(result).toEqual({
        ok: false,
        message: 'Erro de conexão. Tente novamente em instantes.',
      });
    });
  });

  describe('updateTransaction', () => {
    it('envia PUT para /users/:id/account/transactions/:transactionId', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn() });
      vi.stubGlobal('fetch', fetchMock);

      const result = await updateTransaction(969, 'token-123', 789, payload);

      expect(fetchMock).toHaveBeenCalledWith('/api/users/969/account/transactions/789', {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer token-123',
          'content-type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      expect(result).toEqual({ ok: true });
    });

    it('retorna mensagem quando transacao nao e encontrada', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Transação não encontrada' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await updateTransaction(969, 'token-123', 789, payload);

      expect(result).toEqual({ ok: false, message: 'Transação não encontrada' });
    });
  });

  describe('deleteTransaction', () => {
    it('envia DELETE para /users/:id/account/transactions/:transactionId sem body', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: vi.fn() });
      vi.stubGlobal('fetch', fetchMock);

      const result = await deleteTransaction(969, 'token-123', 789);

      expect(fetchMock).toHaveBeenCalledWith('/api/users/969/account/transactions/789', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer token-123',
        },
      });
      expect(result).toEqual({ ok: true });
    });

    it('retorna mensagem de erro quando usuario nao e encontrado', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Usuário não encontrado' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await deleteTransaction(969, 'token-123', 789);

      expect(result).toEqual({ ok: false, message: 'Usuário não encontrado' });
    });
  });

  describe('fetchTransactions', () => {
    it('busca transações paginadas com token e query params', async () => {
      const response = {
        data: [payload],
        pagination: {
          page: 2,
          limit: 5,
          totalItems: 11,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(response),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchTransactions(969, 'token-123', { page: 2, limit: 5 });

      expect(fetchMock).toHaveBeenCalledWith('/api/users/969/account/transactions?page=2&limit=5', {
        headers: {
          Authorization: 'Bearer token-123',
        },
      });
      expect(result).toEqual({ ok: true, transactions: response });
    });

    it('retorna falha quando a resposta paginada vem inválida', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ data: [payload] }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchTransactions(969, 'token-123');

      expect(result).toEqual({
        ok: false,
        message: 'Não foi possível carregar as transações.',
      });
    });

    it('retorna mensagem da API quando a busca paginada falha', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Parâmetros inválidos' }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchTransactions(969, 'token-123');

      expect(result).toEqual({ ok: false, message: 'Parâmetros inválidos' });
    });
  });

  describe('fetchFinancialSummary', () => {
    it('busca o resumo financeiro com token', async () => {
      const summary = {
        balance: 7700,
        depositsTotal: 9700,
        transfersTotal: 2000,
      };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(summary),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchFinancialSummary(969, 'token-123');

      expect(fetchMock).toHaveBeenCalledWith('/api/users/969/account/transactions/summary', {
        headers: {
          Authorization: 'Bearer token-123',
        },
      });
      expect(result).toEqual({ ok: true, summary });
    });

    it('retorna falha quando o resumo financeiro vem invalido', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ balance: 7700 }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchFinancialSummary(969, 'token-123');

      expect(result).toEqual({
        ok: false,
        message: 'Não foi possível carregar o resumo financeiro.',
      });
    });

    it('retorna erro de conexao quando a busca do resumo falha', async () => {
      const fetchMock = vi.fn().mockRejectedValue(new Error('network error'));
      vi.stubGlobal('fetch', fetchMock);

      const result = await fetchFinancialSummary(969, 'token-123');

      expect(result).toEqual({
        ok: false,
        message: 'Erro de conexão. Tente novamente em instantes.',
      });
    });
  });
});
