export const TRANSACTION_DATE_TIME_ZONE = "America/Sao_Paulo";

const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;

export type TransactionDateRange = {
  minDate: string;
  maxDate: string;
};

function parseIsoDate(value: string) {
  const matches = isoDateRegex.exec(value);
  if (!matches) {
    return null;
  }

  const [, yearLabel, monthLabel, dayLabel] = matches;
  const year = Number(yearLabel);
  const month = Number(monthLabel);
  const day = Number(dayLabel);

  const date = new Date(Date.UTC(year, month - 1, day, 12));
  const isValidDate = date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month
    && date.getUTCDate() === day;

  return isValidDate ? { year, month, day } : null;
}

function formatDateParts(date: Date, timeZone: string) {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).formatToParts(date);

  const year = dateParts.find((part) => part.type === "year")?.value ?? "1970";
  const month = dateParts.find((part) => part.type === "month")?.value ?? "01";
  const day = dateParts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export function getCurrentYearInTimeZone(
  referenceDate: Date = new Date(),
  timeZone: string = TRANSACTION_DATE_TIME_ZONE
) {
  const yearLabel = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    timeZone,
  }).format(referenceDate);

  return Number(yearLabel);
}

export function formatIsoDateToPtBr(value: string) {
  const parsed = parseIsoDate(value);
  if (!parsed) {
    return value;
  }

  const day = String(parsed.day).padStart(2, "0");
  const month = String(parsed.month).padStart(2, "0");

  return `${day}/${month}/${parsed.year}`;
}

export function getTransactionDateRange(
  referenceDate: Date = new Date(),
  timeZone: string = TRANSACTION_DATE_TIME_ZONE
): TransactionDateRange {
  const currentYear = getCurrentYearInTimeZone(referenceDate, timeZone);

  return {
    minDate: `${currentYear - 1}-01-01`,
    maxDate: formatDateParts(referenceDate, timeZone),
  };
}

export function getDefaultTransactionDate(
  referenceDate: Date = new Date(),
  timeZone: string = TRANSACTION_DATE_TIME_ZONE
) {
  return formatDateParts(referenceDate, timeZone);
}

export function isTransactionDateWithinRange(value: string, range: TransactionDateRange) {
  if (!parseIsoDate(value) || !parseIsoDate(range.minDate) || !parseIsoDate(range.maxDate)) {
    return false;
  }

  return value >= range.minDate && value <= range.maxDate;
}

export function toTransactionIsoDate(value: string, range: TransactionDateRange): string | null {
  if (!isTransactionDateWithinRange(value, range)) {
    return null;
  }

  // Usa meio-dia UTC para evitar que a conversão para America/Sao_Paulo (UTC-3)
  // recue a data exibida para o dia anterior.
  return `${value}T12:00:00.000Z`;
}

export function dateOnlyFromTransactionDate(
  value: string,
  timeZone: string = TRANSACTION_DATE_TIME_ZONE
): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatDateParts(date, timeZone);
}

export function getTimestampFromTransactionDate(value: string): number | null {
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function formatTransactionDateLabel(
  value: string,
  timeZone: string = TRANSACTION_DATE_TIME_ZONE
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).format(date);
}

export function formatTransactionMonthLabel(
  value: string,
  timeZone: string = TRANSACTION_DATE_TIME_ZONE
): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone,
  }).format(date);

  return `${monthLabel.charAt(0).toUpperCase()}${monthLabel.slice(1)}`;
}
