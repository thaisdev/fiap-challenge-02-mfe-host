export type MockUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
  accountBalance: number;
  statementEntries: MockStatementEntry[];
};

export type PublicMockUser = Omit<MockUser, "password">;

export type MockStatementEntry = {
  id: string;
  month: string;
  type: string;
  amountInCents: number;
  date: string;
};

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

function toPublicUser(user: MockUser): PublicMockUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    accountBalance: user.accountBalance,
    statementEntries: user.statementEntries.map((entry) => ({ ...entry })),
  };
}

function createMockToken(userId: string) {
  return `mock-token-${userId}`;
}

const DEFAULT_STATEMENT_TIME_ZONE = "America/Sao_Paulo";

function getCurrentStatementYear(referenceDate: Date = new Date()) {
  const yearLabel = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone: DEFAULT_STATEMENT_TIME_ZONE,
  }).format(referenceDate);

  return Number(yearLabel);
}

function formatStatementDateLabel(referenceDate: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: DEFAULT_STATEMENT_TIME_ZONE,
  }).format(referenceDate);
}

function formatStatementMonthLabel(referenceDate: Date) {
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: DEFAULT_STATEMENT_TIME_ZONE,
  }).format(referenceDate);

  return `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}`;
}

function createDateFromDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function createDateInYear(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day, 12));
}

function createStatementEntry(referenceDate: Date, type: "Deposit" | "Transfer", amountInCents: number) {
  return {
    id: crypto.randomUUID(),
    month: formatStatementMonthLabel(referenceDate),
    type,
    amountInCents,
    date: formatStatementDateLabel(referenceDate),
  } satisfies MockStatementEntry;
}

function createDefaultStatementEntries() {
  const currentYear = getCurrentStatementYear();
  const previousYear = currentYear - 1;

  return [
    createStatementEntry(createDateFromDaysAgo(1), "Deposit", 18000),
    createStatementEntry(createDateFromDaysAgo(3), "Transfer", -7200),
    createStatementEntry(createDateFromDaysAgo(7), "Deposit", 9500),
    createStatementEntry(createDateFromDaysAgo(11), "Transfer", -18500),
    createStatementEntry(createDateFromDaysAgo(16), "Deposit", 24000),
    createStatementEntry(createDateFromDaysAgo(24), "Deposit", 12500),
    createStatementEntry(createDateInYear(previousYear, 10, 21), "Deposit", 10000),
    createStatementEntry(createDateInYear(previousYear, 10, 18), "Deposit", 5000),
    createStatementEntry(createDateInYear(previousYear, 9, 12), "Transfer", -50000),
    createStatementEntry(createDateInYear(previousYear, 8, 2), "Deposit", 15000),
  ] satisfies MockStatementEntry[];
}

function ensureUserHasDefaultEntries(user: MockUser) {
  if (user.statementEntries.length >= 8) {
    return;
  }

  user.statementEntries = createDefaultStatementEntries();
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
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    password,
    createdAt: new Date().toISOString(),
    accountBalance: 2500,
    statementEntries: createDefaultStatementEntries(),
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

  ensureUserHasDefaultEntries(user);

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
