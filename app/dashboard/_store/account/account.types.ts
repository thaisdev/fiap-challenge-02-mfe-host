import type { Transaction } from '../../_components/interfaces/statement-panel.interfaces';
import type { TransactionFilters, TransactionsPagination } from '../../_services/transaction-service';

export type AccountRequestStatus = 'idle' | 'loading' | 'ready' | 'error';

export type AccountData = {
  balance: number;
};

export type AccountRequestState = {
  status: AccountRequestStatus;
  errorMessage: string | null;
};

export type TransactionsState = {
  data: Transaction[];
  request: AccountRequestState;
};

export type PaginatedTransactionsState = TransactionsState & {
  pagination: TransactionsPagination;
  filters: TransactionFilters;
};

export type FinancialSummaryState = {
  data: FinancialVisibilityData;
  request: AccountRequestState;
};

export type AccountState = {
  data: AccountData;
  request: AccountRequestState;
  latestTransactions: TransactionsState;
  transactionsPage: PaginatedTransactionsState;
  financialSummary: FinancialSummaryState;
};

export type FinancialVisibilityData = {
  balance: number;
  depositsTotal: number;
  transfersTotal: number;
  transactions: Transaction[];
};
