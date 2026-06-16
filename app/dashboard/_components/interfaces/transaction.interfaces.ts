export enum TransactionType {
  DEPOSIT = "DEPOSIT",
  TRANSFER = "TRANSFER",
}

export function toTransactionType(value: unknown): TransactionType {
  return value === TransactionType.TRANSFER ? TransactionType.TRANSFER : TransactionType.DEPOSIT;
}

export function formatTransactionTypeLabel(type: TransactionType) {
  return type === TransactionType.DEPOSIT ? "Depósito" : "Transferência";
}
