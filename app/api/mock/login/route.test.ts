import { beforeEach, describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';
import { registerMockUser, resetMockUsersStore } from '@/app/lib/mock-auth';
import { POST } from './route';

describe('POST /api/mock/login', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
    resetMockUsersStore();
  });

  it('retorna 400 quando body tem JSON invalido', async () => {
    const request = new Request('http://localhost:3000/api/mock/login', {
      method: 'POST',
      body: '{ email-invalido',
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toContain('JSON invalido');
  });

  it('retorna 400 quando faltam campos obrigatórios', async () => {
    const request = new Request('http://localhost:3000/api/mock/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'teste@mail.com' }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.message).toContain('Campos obrigatórios');
  });

  it('retorna 401 quando credenciais sao invalidas', async () => {
    const request = new Request('http://localhost:3000/api/mock/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'naoexiste@mail.com',
        password: '123456',
      }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.message).toContain('invalidos');
  });

  it('retorna 200 com token e user para credenciais validas', async () => {
    registerMockUser({
      name: 'Bruno Lima',
      email: 'bruno@mail.com',
      password: '654321',
    });

    const request = new Request('http://localhost:3000/api/mock/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'BRUNO@mail.com',
        password: '654321',
      }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.message).toBe('Login realizado com sucesso.');
    expect(payload.user.email).toBe('bruno@mail.com');
    expect(payload.user.password).toBeUndefined();
    expect(jwt.verify(payload.token, 'test-jwt-secret')).toMatchObject({
      email: 'bruno@mail.com',
      name: 'Bruno Lima',
      sub: payload.user.id,
    });
  });
});
