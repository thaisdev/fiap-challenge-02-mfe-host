import { beforeEach, describe, expect, it } from 'vitest';
import { registerMockUser, resetMockUsersStore } from '@/app/lib/mock-auth';
import { GET } from './route';

describe('GET /api/mock/account/balance', () => {
  beforeEach(() => {
    resetMockUsersStore();
  });

  it('retorna 404 quando nao ha conta mockada', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.message).toBe('Nenhuma conta mockada encontrada.');
  });

  it('retorna o saldo atual da conta mockada', async () => {
    registerMockUser({
      name: 'Ana Souza',
      email: 'ana@mail.com',
      password: '123456',
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({
      accountBalanceInCents: 250000,
      currency: 'BRL',
    });
  });
});
