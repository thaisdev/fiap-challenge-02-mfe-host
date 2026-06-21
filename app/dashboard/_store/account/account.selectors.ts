import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { TransactionType } from '../../_components/interfaces/statement-panel.interfaces';
import type { FinancialVisibilityData } from './account.types';

export const selectAccountData = (state: RootState) => state.account.data;

export const selectAccountBalance = (state: RootState) => state.account.data.balance;

export const selectAccountTransactions = (state: RootState) => state.account.data.transactions;

export const selectAccountRequest = (state: RootState) => state.account.request;

export const selectFinancialVisibilityData = createSelector(
  [selectAccountBalance, selectAccountTransactions],
  (balance, transactions): FinancialVisibilityData => ({
    balance,
    depositsTotal: transactions
      .filter((transaction) => transaction.type === TransactionType.DEPOSIT)
      .reduce((total, transaction) => total + transaction.value, 0),
    transfersTotal: transactions
      .filter((transaction) => transaction.type === TransactionType.TRANSFER)
      .reduce((total, transaction) => total + transaction.value, 0),
    transactions: transactions.map((transaction) => ({ ...transaction })),
  })
);
