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

export type AuthenticatedUser = {
  id: number;
  name: string;
  email: string;
};

export type LoginAccountResult =
  | (ServiceResult & { ok: true; token: string; user: AuthenticatedUser })
  | (ServiceResult & { ok: false });

type RegisterAccountPayload = {
  name: string;
  email: string;
  password: string;
};

type LoginAccountPayload = {
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
  payload: RegisterAccountPayload | LoginAccountPayload,
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

type LoginUser = {
  id: number;
  name: string;
  email: string;
};

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

function isAuthAccount(value: unknown): value is AuthAccount {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const account = value as Record<string, unknown>;

  return (
    typeof account.balance === 'number' &&
    Array.isArray(account.transactions) &&
    account.transactions.every(isAuthTransaction)
  );
}

function isLoginUser(value: unknown): value is LoginUser {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const user = value as Record<string, unknown>;

  return (
    typeof user.id === 'number' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string'
  );
}

export async function fetchAccountByUserId(
  userId: number,
  token: string
): Promise<{ ok: true; account: AuthAccount } | { ok: false; message: string }> {
  const fallbackErrorMessage = 'Nao foi possivel autenticar. Revise seus dados.';

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/account`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = (await response.json().catch(() => null)) as ServiceMessageResponse | null;

    if (!response.ok) {
      return {
        ok: false,
        message: resolveMessage({
          response,
          body,
          fallbackSuccessMessage: fallbackErrorMessage,
          fallbackErrorMessage,
        }),
      };
    }

    if (!isAuthAccount(body)) {
      return {
        ok: false,
        message: fallbackErrorMessage,
      };
    }

    return {
      ok: true,
      account: body,
    };
  } catch {
    return {
      ok: false,
      message: 'Erro de conexao. Tente novamente em instantes.',
    };
  }
}

export async function registerAccount(payload: RegisterAccountPayload) {
  const result = await postJson(`${process.env.NEXT_PUBLIC_API_URL}/users`, payload, {
    fallbackSuccessMessage: 'Usuario criado com sucesso.',
    fallbackErrorMessage: 'Nao foi possivel criar a conta. Tente novamente.',
  });

  return {
    ok: result.ok,
    message: result.message,
  };
}

export async function loginAccount(payload: LoginAccountPayload) {
  const result = await postJson(`${process.env.NEXT_PUBLIC_API_URL}/login`, payload, {
    fallbackSuccessMessage: 'Login realizado com sucesso.',
    fallbackErrorMessage: 'Nao foi possivel autenticar. Revise seus dados.',
  });

  if (!result.ok || typeof result.body?.token !== 'string' || !isLoginUser(result.body.user)) {
    return {
      ok: false as const,
      message: result.message,
    };
  }

  const { token } = result.body;
  const { id, name, email } = result.body.user;

  return {
    ok: true as const,
    message: result.message,
    token,
    user: { id, name, email },
  };
}
