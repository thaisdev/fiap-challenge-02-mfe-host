import { beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { loginMockUser, registerMockUser, resetMockUsersStore, type MockUser } from "./mock-auth";

describe("mock-auth", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
    resetMockUsersStore();
  });

  it("cadastra usuario com email normalizado", () => {
    const result = registerMockUser({
      name: "Maria da Silva",
      email: "  MARIA@MAIL.COM ",
      password: "123456",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.user.name).toBe("Maria da Silva");
      expect(result.user.email).toBe("maria@mail.com");
      expect(result.user.id).toBeTruthy();
      expect(result.user.createdAt).toBeTruthy();
    }
  });

  it("bloqueia cadastro com email duplicado", () => {
    registerMockUser({
      name: "Maria da Silva",
      email: "maria@mail.com",
      password: "123456",
    });

    const duplicated = registerMockUser({
      name: "Maria da Silva",
      email: "MARIA@mail.com",
      password: "123456",
    });

    expect(duplicated).toEqual({
      ok: false,
      error: "EMAIL_ALREADY_EXISTS",
    });
  });

  it("bloqueia cadastro com senha menor que 6 caracteres", () => {
    const result = registerMockUser({
      name: "Maria da Silva",
      email: "maria@mail.com",
      password: "123",
    });

    expect(result).toEqual({
      ok: false,
      error: "INVALID_PASSWORD",
    });
  });

  it("faz login com credenciais validas", () => {
    const register = registerMockUser({
      name: "Joao Souza",
      email: "joao@mail.com",
      password: "senha-segura",
    });

    expect(register.ok).toBe(true);

    const login = loginMockUser({
      email: "JOAO@mail.com",
      password: "senha-segura",
    });

    expect(login.ok).toBe(true);

    if (login.ok) {
      expect(login.user.email).toBe("joao@mail.com");
      expect(jwt.verify(login.token, "test-jwt-secret")).toMatchObject({
        email: "joao@mail.com",
        name: "Joao Souza",
        sub: login.user.id,
      });
    }
  });

  it("preenche extrato padrao ao logar usuario legado sem lancamentos", () => {
    const globalWithMockUsers = globalThis as typeof globalThis & {
      __mockUsers?: MockUser[];
    };

    globalWithMockUsers.__mockUsers = [
      {
        id: "user-legado",
        name: "Usuario Legado",
        email: "legado@mail.com",
        password: "senha-segura",
        createdAt: "2026-04-01T12:00:00.000Z",
        accountBalanceInCents: 250000,
        statementEntries: [],
      },
    ];

    const login = loginMockUser({
      email: "legado@mail.com",
      password: "senha-segura",
    });

    expect(login.ok).toBe(true);

    if (login.ok) {
      expect(login.user.statementEntries.length).toBeGreaterThanOrEqual(8);
    }
  });

  it("retorna erro em login invalido", () => {
    const login = loginMockUser({
      email: "naoexiste@mail.com",
      password: "senha-incorreta",
    });

    expect(login).toEqual({
      ok: false,
      error: "INVALID_CREDENTIALS",
    });
  });
});
