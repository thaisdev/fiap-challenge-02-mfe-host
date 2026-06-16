export type MockTransaction = {
  id: number;
  type: "DEPOSIT" | "TRANSFER";
  date: string;
  value: number;
};

export type MockAccount = {
  balance: number;
  transactions: MockTransaction[];
};

export type MockUser = {
  id: number;
  name: string;
  email: string;
  password: string;
  account: MockAccount;
};

export type PublicMockUser = Omit<MockUser, "password">;

type RegisterMockUserInput = {
  name: string;
  email: string;
  password: string;
};

type LoginMockUserInput = {
  email: string;
  password: string;
};

type RegisterMockUserResult =
  | { ok: true; user: PublicMockUser }
  | { ok: false; error: "EMAIL_ALREADY_EXISTS" | "INVALID_PASSWORD" };

type LoginMockUserResult =
  | { ok: true; user: PublicMockUser; token: string }
  | { ok: false; error: "INVALID_CREDENTIALS" };

type GlobalMockUsers = typeof globalThis & {
  __mockUsers?: MockUser[];
};

function getMockUsersStore() {
  const globalWithMockUsers = globalThis as GlobalMockUsers;
  globalWithMockUsers.__mockUsers ??= [];
  return globalWithMockUsers.__mockUsers;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isPasswordValid(password: string) {
  return password.trim().length >= 6;
}

function createMockId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function toPublicUser(user: MockUser): PublicMockUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    account: {
      balance: user.account.balance,
      transactions: user.account.transactions.map((transaction) => ({ ...transaction })),
    },
  };
}

function createMockToken(userId: number) {
  return `mock-token-${userId}`;
}

const DEFAULT_TRANSACTION_TIME_ZONE = "America/Sao_Paulo";

function createDateFromDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function createDateInYear(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day, 12));
}

function getCurrentTransactionYear(referenceDate: Date = new Date()) {
  const yearLabel = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: DEFAULT_TRANSACTION_TIME_ZONE,
  }).format(referenceDate);

  return Number(yearLabel);
}

function createMockTransaction(referenceDate: Date, type: "DEPOSIT" | "TRANSFER", value: number) {
  return {
    id: createMockId(),
    type,
    date: referenceDate.toISOString(),
    value,
  } satisfies MockTransaction;
}

function createDefaultTransactions() {
  const currentYear = getCurrentTransactionYear();
  const previousYear = currentYear - 1;

  return [
    createMockTransaction(createDateFromDaysAgo(1), "DEPOSIT", 180),
    createMockTransaction(createDateFromDaysAgo(3), "TRANSFER", 72),
    createMockTransaction(createDateFromDaysAgo(7), "DEPOSIT", 95),
    createMockTransaction(createDateFromDaysAgo(11), "TRANSFER", 185),
    createMockTransaction(createDateFromDaysAgo(16), "DEPOSIT", 240),
    createMockTransaction(createDateFromDaysAgo(24), "DEPOSIT", 125),
    createMockTransaction(createDateInYear(previousYear, 10, 21), "DEPOSIT", 100),
    createMockTransaction(createDateInYear(previousYear, 10, 18), "DEPOSIT", 50),
    createMockTransaction(createDateInYear(previousYear, 9, 12), "TRANSFER", 500),
    createMockTransaction(createDateInYear(previousYear, 8, 2), "DEPOSIT", 150),
  ] satisfies MockTransaction[];
}

function ensureUserHasDefaultTransactions(user: MockUser) {
  if (user.account.transactions.length >= 8) {
    return;
  }

  user.account.transactions = createDefaultTransactions();
}

export function registerMockUser({
  name,
  email,
  password,
}: RegisterMockUserInput): RegisterMockUserResult {
  if (!isPasswordValid(password)) {
    return {
      ok: false,
      error: "INVALID_PASSWORD",
    };
  }

  const users = getMockUsersStore();
  const normalizedEmail = normalizeEmail(email);
  const alreadyExists = users.some((user) => user.email === normalizedEmail);

  if (alreadyExists) {
    return {
      ok: false,
      error: "EMAIL_ALREADY_EXISTS",
    };
  }

  const newUser: MockUser = {
    id: createMockId(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    account: {
      balance: 2500,
      transactions: createDefaultTransactions(),
    },
  };

  users.push(newUser);

  return {
    ok: true,
    user: toPublicUser(newUser),
  };
}

export function loginMockUser({
  email,
  password,
}: LoginMockUserInput): LoginMockUserResult {
  const users = getMockUsersStore();
  const normalizedEmail = normalizeEmail(email);
  const user = users.find(
    (storedUser) =>
      storedUser.email === normalizedEmail && storedUser.password === password
  );

  if (!user) {
    return {
      ok: false,
      error: "INVALID_CREDENTIALS",
    };
  }

  ensureUserHasDefaultTransactions(user);

  return {
    ok: true,
    user: toPublicUser(user),
    token: createMockToken(user.id),
  };
}

export function resetMockUsersStore() {
  const users = getMockUsersStore();
  users.splice(0, users.length);
}

export function listMockUsers(): PublicMockUser[] {
  const users = getMockUsersStore();
  return users.map(toPublicUser);
}
