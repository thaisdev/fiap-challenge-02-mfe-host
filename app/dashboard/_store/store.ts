import { configureStore } from '@reduxjs/toolkit';
import type { Action, ThunkAction } from '@reduxjs/toolkit';
import { accountReducer } from './account/account.slice';

export function makeDashboardStore() {
  return configureStore({
    reducer: {
      account: accountReducer,
    },
  });
}

export type DashboardStore = ReturnType<typeof makeDashboardStore>;
export type RootState = ReturnType<DashboardStore['getState']>;
export type AppDispatch = DashboardStore['dispatch'];
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action
>;
