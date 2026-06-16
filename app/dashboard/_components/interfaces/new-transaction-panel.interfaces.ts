import { TransactionType } from './transaction.interfaces';

export { TransactionType };

export type NewTransactionPayload = {
  type: TransactionType;
  amount: number;
  transactionDate: string;
};

export type NewTransactionResult = { ok: true } | { ok: false; message: string };
