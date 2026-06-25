import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AccountData,
  AccountState,
  FinancialVisibilityData,
  TransactionsState,
} from './account.types';
import type { PaginatedTransactions, TransactionFilters, TransactionPaginationQuery, TransactionsPagination } from '../../_services/transaction-service';
import {
  TransactionType,
  type Transaction,
} from '../../_components/interfaces/statement-panel.interfaces';

const initialPagination: TransactionsPagination = {
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function createInitialTransactionsState(): TransactionsState {
  return {
    data: [],
    request: {
      status: 'idle',
      errorMessage: null,
    },
  };
}

const initialFinancialSummary: FinancialVisibilityData = {
  balance: 0,
  depositsTotal: 0,
  transfersTotal: 0,
  transactions: [],
};

function getTransactionTimestamp(transaction: Transaction) {
  const timestamp = new Date(transaction.date).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortTransactionsByMostRecent(transactions: Transaction[]) {
  transactions.sort((currentTransaction, nextTransaction) => {
    return getTransactionTimestamp(nextTransaction) - getTransactionTimestamp(currentTransaction);
  });
}

function signedTransactionValue(transaction: Transaction) {
  return transaction.type === TransactionType.TRANSFER
    ? -transaction.value
    : transaction.value;
}

function applyTransactionToSummary(
  summary: FinancialVisibilityData,
  transaction: Transaction,
  operation: 1 | -1
) {
  const value = transaction.value * operation;

  summary.balance += signedTransactionValue(transaction) * operation;

  if (transaction.type === TransactionType.DEPOSIT) {
    summary.depositsTotal += value;
    return;
  }

  summary.transfersTotal += value;
}

function recalculatePagination(pagination: TransactionsPagination, totalItems: number) {
  pagination.totalItems = Math.max(0, totalItems);
  pagination.totalPages = Math.ceil(pagination.totalItems / pagination.limit);
  pagination.hasPreviousPage = pagination.page > 1;
  pagination.hasNextPage = pagination.page < pagination.totalPages;
}

function upsertTransaction(transactions: Transaction[], transaction: Transaction) {
  const transactionIndex = transactions.findIndex((entry) => entry.id === transaction.id);

  if (transactionIndex >= 0) {
    transactions[transactionIndex] = transaction;
  } else {
    transactions.push(transaction);
  }

  sortTransactionsByMostRecent(transactions);
}

function removeTransaction(transactions: Transaction[], transactionId: number) {
  const transactionIndex = transactions.findIndex((entry) => entry.id === transactionId);

  if (transactionIndex >= 0) {
    transactions.splice(transactionIndex, 1);
  }
}

function trimLatestTransactions(state: AccountState) {
  state.latestTransactions.data = state.latestTransactions.data.slice(0, 6);
}

function trimTransactionsPage(state: AccountState) {
  const { limit } = state.transactionsPage.pagination;
  state.transactionsPage.data = state.transactionsPage.data.slice(0, limit);
}

const initialState: AccountState = {
  data: {
    balance: 0,
  },
  request: {
    status: 'idle',
    errorMessage: null,
  },
  latestTransactions: createInitialTransactionsState(),
  transactionsPage: {
    ...createInitialTransactionsState(),
    pagination: initialPagination,
    filters: {},
  },
  financialSummary: {
    data: initialFinancialSummary,
    request: {
      status: 'idle',
      errorMessage: null,
    },
  },
};

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAccountLoading(state) {
      state.data.balance = 0;
      state.request.status = 'loading';
      state.request.errorMessage = null;
    },
    hydrateAccount(state, action: PayloadAction<AccountData>) {
      state.data.balance = action.payload.balance;
      state.request.status = 'ready';
      state.request.errorMessage = null;
    },
    setAccountError(state, action: PayloadAction<string>) {
      state.request.status = 'error';
      state.request.errorMessage = action.payload;
    },
    setLatestTransactionsLoading(state) {
      state.latestTransactions.request.status = 'loading';
      state.latestTransactions.request.errorMessage = null;
    },
    hydrateLatestTransactions(state, action: PayloadAction<PaginatedTransactions>) {
      state.latestTransactions.data = [...action.payload.data];
      state.latestTransactions.request.status = 'ready';
      state.latestTransactions.request.errorMessage = null;
    },
    setLatestTransactionsError(state, action: PayloadAction<string>) {
      state.latestTransactions.request.status = 'error';
      state.latestTransactions.request.errorMessage = action.payload;
    },
    setTransactionsPageLoading(state, action: PayloadAction<TransactionPaginationQuery & TransactionFilters>) {
      state.transactionsPage.request.status = 'loading';
      state.transactionsPage.request.errorMessage = null;
      state.transactionsPage.pagination.page = action.payload.page;
      state.transactionsPage.pagination.limit = action.payload.limit;
      state.transactionsPage.filters = {
        startDate: action.payload.startDate,
        endDate: action.payload.endDate,
        type: action.payload.type,
      };
    },
    hydrateTransactionsPage(state, action: PayloadAction<PaginatedTransactions>) {
      state.transactionsPage.data = [...action.payload.data];
      state.transactionsPage.pagination = { ...action.payload.pagination };
      state.transactionsPage.request.status = 'ready';
      state.transactionsPage.request.errorMessage = null;
    },
    setTransactionsPageError(state, action: PayloadAction<string>) {
      state.transactionsPage.request.status = 'error';
      state.transactionsPage.request.errorMessage = action.payload;
    },
    setFinancialSummaryLoading(state) {
      state.financialSummary.request.status = 'loading';
      state.financialSummary.request.errorMessage = null;
    },
    hydrateFinancialSummary(
      state,
      action: PayloadAction<Omit<FinancialVisibilityData, 'transactions'>>
    ) {
      state.financialSummary.data = {
        ...action.payload,
        transactions: [],
      };
      state.financialSummary.request.status = 'ready';
      state.financialSummary.request.errorMessage = null;
    },
    setFinancialSummaryError(state, action: PayloadAction<string>) {
      state.financialSummary.request.status = 'error';
      state.financialSummary.request.errorMessage = action.payload;
    },
    applyTransactionCreated(state, action: PayloadAction<Transaction>) {
      const transaction = action.payload;

      state.data.balance += signedTransactionValue(transaction);
      applyTransactionToSummary(state.financialSummary.data, transaction, 1);
      state.financialSummary.request.status = 'ready';
      state.financialSummary.request.errorMessage = null;

      upsertTransaction(state.latestTransactions.data, transaction);
      trimLatestTransactions(state);

      if (state.transactionsPage.request.status !== 'idle') {
        if (state.transactionsPage.pagination.page === 1) {
          upsertTransaction(state.transactionsPage.data, transaction);
          trimTransactionsPage(state);
        }

        recalculatePagination(
          state.transactionsPage.pagination,
          state.transactionsPage.pagination.totalItems + 1
        );
      }
    },
    applyTransactionUpdated(
      state,
      action: PayloadAction<{ previousTransaction: Transaction; nextTransaction: Transaction }>
    ) {
      const { previousTransaction, nextTransaction } = action.payload;

      state.data.balance -= signedTransactionValue(previousTransaction);
      state.data.balance += signedTransactionValue(nextTransaction);
      applyTransactionToSummary(state.financialSummary.data, previousTransaction, -1);
      applyTransactionToSummary(state.financialSummary.data, nextTransaction, 1);
      state.financialSummary.request.status = 'ready';
      state.financialSummary.request.errorMessage = null;

      upsertTransaction(state.latestTransactions.data, nextTransaction);
      trimLatestTransactions(state);

      if (state.transactionsPage.request.status !== 'idle') {
        upsertTransaction(state.transactionsPage.data, nextTransaction);
        trimTransactionsPage(state);
      }
    },
    applyTransactionDeleted(state, action: PayloadAction<Transaction>) {
      const transaction = action.payload;

      state.data.balance -= signedTransactionValue(transaction);
      applyTransactionToSummary(state.financialSummary.data, transaction, -1);
      state.financialSummary.request.status = 'ready';
      state.financialSummary.request.errorMessage = null;

      removeTransaction(state.latestTransactions.data, transaction.id);

      if (state.transactionsPage.request.status !== 'idle') {
        removeTransaction(state.transactionsPage.data, transaction.id);
        recalculatePagination(
          state.transactionsPage.pagination,
          state.transactionsPage.pagination.totalItems - 1
        );
      }
    },
  },
});

export const accountActions = accountSlice.actions;
export const accountReducer = accountSlice.reducer;
