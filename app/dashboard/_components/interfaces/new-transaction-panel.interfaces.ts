import { TransactionType } from './transaction.interfaces';

export { TransactionType };

export type ReceiptFile = {
  url: string;
  filename: string;
};

export type NewTransactionPayload = {
  type: TransactionType;
  value: number;
  transactionDate: string;
  receiptFile?: ReceiptFile | null;
};

export type NewTransactionResult = { ok: true } | { ok: false; message: string };
