import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AccountData, AccountState } from './account.types';

const initialState: AccountState = {
  data: {
    balance: 0,
    transactions: [],
  },
  request: {
    status: 'idle',
    errorMessage: null,
  },
};

export const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    setAccountLoading(state) {
      state.data.balance = 0;
      state.data.transactions = [];
      state.request.status = 'loading';
      state.request.errorMessage = null;
    },
    hydrateAccount(state, action: PayloadAction<AccountData>) {
      state.data.balance = action.payload.balance;
      state.data.transactions = [...action.payload.transactions];
      state.request.status = 'ready';
      state.request.errorMessage = null;
    },
    setAccountError(state, action: PayloadAction<string>) {
      state.request.status = 'error';
      state.request.errorMessage = action.payload;
    },
  },
});

export const accountActions = accountSlice.actions;
export const accountReducer = accountSlice.reducer;
