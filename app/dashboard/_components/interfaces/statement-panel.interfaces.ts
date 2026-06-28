import type { NewTransactionResult, ReceiptFile } from "./new-transaction-panel.interfaces";
import {
  TransactionType,
  formatTransactionTypeLabel,
  toTransactionType,
} from "./transaction.interfaces";

export { TransactionType, formatTransactionTypeLabel, toTransactionType };
export type { ReceiptFile };

export type Transaction = {
  id: number;
  type: TransactionType;
  date: string;
  value: number;
  receiptFile?: ReceiptFile | null;
};

export type EditTransactionPayload = {
  transactionId: number;
  type: TransactionType;
  value: number;
  transactionDate: string;
  receiptFile?: ReceiptFile | null;
};

export type EditTransactionResult = NewTransactionResult;
