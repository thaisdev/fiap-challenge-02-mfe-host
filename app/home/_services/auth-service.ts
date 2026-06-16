import { TransactionType } from '@/app/dashboard/_components/interfaces/transaction.interfaces';

type ServiceMessageResponse = {
  message?: unknown;
  token?: unknown;
  user?: unknown;
};

type ServiceResult = {
  ok: boolean;
  message: string;
};

export type AuthTransaction = {
  id: number;
  type: TransactionType;
  date: string;
  value: number;
};

export type AuthAccount = {
  balance: number;
  transactions: AuthTransaction[];
};

export type AuthenticatedMockUser = {
  id: number;
  name: string;
  email: string;
  account: AuthAccount;
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

function isAuthTransaction(value: unknown): value is AuthTransaction {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const transaction = value as Record<string, unknown>;

  return (
    typeof transaction.id === 'number' &&
    (transaction.type === TransactionType.DEPOSIT || transaction.type === TransactionType.TRANSFER) &&
    typeof transaction.date === 'string' &&
    typeof transaction.value === 'number'
  );
}

function isAuthenticatedMockUser(value: unknown): value is AuthenticatedMockUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as Record<string, unknown>;
  const account = user.account as Record<string, unknown> | undefined;

  return (
    typeof user.id === 'number' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    !!account &&
    typeof account === 'object' &&
    typeof account.balance === 'number' &&
    Array.isArray(account.transactions) &&
    account.transactions.every(isAuthTransaction)
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
