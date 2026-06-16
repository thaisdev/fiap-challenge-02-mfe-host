import type { NewTransactionResult } from "./new-transaction-panel.interfaces";
import {
  StatementEntryType,
  TransactionType,
  formatStatementEntryTypeLabel,
  normalizeStatementEntryType,
  toStatementEntryType,
  toTransactionType,
} from "./transaction.interfaces";

export {
  StatementEntryType,
  TransactionType,
  formatStatementEntryTypeLabel,
  normalizeStatementEntryType,
  toStatementEntryType,
  toTransactionType,
};

export type StatementEntry = {
  id: string;
  month: string;
  type: StatementEntryType;
  amount: number;
  date: string;
};

export type EditStatementEntryPayload = {
  entryId: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
};

export type EditStatementEntryResult = NewTransactionResult;
