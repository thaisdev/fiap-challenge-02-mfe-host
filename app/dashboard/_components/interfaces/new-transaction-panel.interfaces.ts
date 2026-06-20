import { TransactionType } from './transaction.interfaces';

export { TransactionType };

export type NewTransactionPayload = {
  type: TransactionType;
  value: number;
  transactionDate: string;
  receiptFileUrl?: string | null;
};

export type NewTransactionResult = { ok: true } | { ok: false; message: string };
