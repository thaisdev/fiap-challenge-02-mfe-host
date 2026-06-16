import { StatementEntryType } from '@/app/dashboard/_components/interfaces/statement-panel.interfaces';

type ServiceMessageResponse = {
  message?: unknown;
  token?: unknown;
  user?: unknown;
};

type ServiceResult = {
  ok: boolean;
  message: string;
};

export type AuthStatementEntry = {
  id: string;
  month: string;
  type: StatementEntryType;
  amount: number;
  date: string;
};

export type AuthenticatedMockUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  accountBalance: number;
  statementEntries: AuthStatementEntry[];
};

export type LoginMockAccountResult =
  | (ServiceResult & { ok: true; token: string; user: AuthenticatedMockUser })
  | (ServiceResult & { ok: false });

type RegisterMockAccountPayload = {
  name: string;
  email: string;
  password: string;
};

type LoginMockAccountPayload = {
  email: string;
  password: string;
};

type PostJsonOptions = {
  fallbackSuccessMessage: string;
  fallbackErrorMessage: string;
};

function resolveMessage({
  response,
  body,
  fallbackSuccessMessage,
  fallbackErrorMessage,
}: {
  response: Response;
  body: ServiceMessageResponse | null;
  fallbackSuccessMessage: string;
  fallbackErrorMessage: string;
}) {
  const fallbackMessage = response.ok ? fallbackSuccessMessage : fallbackErrorMessage;

  if (typeof body?.message === 'string' && body.message.trim().length > 0) {
    return body.message;
  }

  return fallbackMessage;
}

async function postJson(
  path: string,
  payload: RegisterMockAccountPayload | LoginMockAccountPayload,
  { fallbackSuccessMessage, fallbackErrorMessage }: PostJsonOptions
): Promise<ServiceResult & { body: ServiceMessageResponse | null }> {
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => null)) as ServiceMessageResponse | null;

    return {
      ok: response.ok,
      message: resolveMessage({
        response,
        body,
        fallbackSuccessMessage,
        fallbackErrorMessage,
      }),
      body,
    };
  } catch {
    return {
      ok: false,
      message: 'Erro de conexao. Tente novamente em instantes.',
      body: null,
    };
  }
}

async function fetchAuthenticatedMockUserByEmail(email: string) {
  try {
    const response = await fetch('/api/mock/users');

    if (!response.ok) {
      return null;
    }

    const body = (await response.json().catch(() => null)) as { users?: unknown } | null;

    if (!body || !Array.isArray(body.users)) {
      return null;
    }

    return (
      body.users.find(
        (user): user is AuthenticatedMockUser =>
          isAuthenticatedMockUser(user) && user.email.toLowerCase() === email.toLowerCase()
      ) ?? null
    );
  } catch {
    return null;
  }
}

function isStatementEntry(value: unknown): value is AuthStatementEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === 'string' &&
    typeof entry.month === 'string' &&
    typeof entry.type === 'string' &&
    typeof entry.amount === 'number' &&
    typeof entry.date === 'string'
  );
}

function isAuthenticatedMockUser(value: unknown): value is AuthenticatedMockUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    typeof user.createdAt === 'string' &&
    typeof user.accountBalance === 'number' &&
    Array.isArray(user.statementEntries) &&
    user.statementEntries.every(isStatementEntry)
  );
}

export async function registerMockAccount(payload: RegisterMockAccountPayload) {
  const result = await postJson('http://localhost:3333/users', payload, {
    fallbackSuccessMessage: 'Usuario criado com sucesso.',
    fallbackErrorMessage: 'Nao foi possivel criar a conta. Tente novamente.',
  });

  return {
    ok: result.ok,
    message: result.message,
  };
}

export async function loginMockAccount(payload: LoginMockAccountPayload) {
  const result = await postJson('http://localhost:3333/login', payload, {
    fallbackSuccessMessage: 'Login realizado com sucesso.',
    fallbackErrorMessage: 'Nao foi possivel autenticar. Revise seus dados.',
  });

  if (result.ok && typeof result.body?.token === 'string') {
    const user = await fetchAuthenticatedMockUserByEmail(payload.email);

    if (user) {
      return {
        ok: true as const,
        message: result.message,
        token: result.body.token,
        user,
      };
    }

    return {
      ok: false as const,
      message: 'Nao foi possivel autenticar. Revise seus dados.',
    };
  }

  return {
    ok: false as const,
    message: result.message,
  };
}
