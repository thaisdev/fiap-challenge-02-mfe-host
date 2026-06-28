import type { RootState } from '../store';

export const selectAccountData = (state: RootState) => state.account.data;

export const selectAccountBalance = (state: RootState) => state.account.data.balance;

export const selectAccountRequest = (state: RootState) => state.account.request;

export const selectLatestTransactions = (state: RootState) => state.account.latestTransactions.data;

export const selectLatestTransactionsRequest = (state: RootState) =>
  state.account.latestTransactions.request;

export const selectTransactionsPage = (state: RootState) => state.account.transactionsPage;

export const selectFinancialSummaryRequest = (state: RootState) =>
  state.account.financialSummary.request;

export const selectFinancialVisibilityData = (state: RootState) => ({
  ...state.account.financialSummary.data,
  transactions: state.account.financialSummary.data.transactions.map((transaction) => ({
    ...transaction,
  })),
});

export const selectKnownTransactions = (state: RootState) => [
  ...state.account.latestTransactions.data,
  ...state.account.transactionsPage.data.filter(
    (transaction) =>
      !state.account.latestTransactions.data.some(
        (latestTransaction) => latestTransaction.id === transaction.id
      )
  ),
];
