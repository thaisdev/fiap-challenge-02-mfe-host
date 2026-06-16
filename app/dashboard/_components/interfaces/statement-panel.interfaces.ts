import type { NewTransactionResult } from "./new-transaction-panel.interfaces";
import {
  TransactionType,
  formatTransactionTypeLabel,
  toTransactionType,
} from "./transaction.interfaces";

export { TransactionType, formatTransactionTypeLabel, toTransactionType };

export type Transaction = {
  id: number;
  type: TransactionType;
  date: string;
  value: number;
};

export type EditTransactionPayload = {
  transactionId: number;
  type: TransactionType;
  value: number;
  transactionDate: string;
};

export type EditTransactionResult = NewTransactionResult;
