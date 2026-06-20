import type { Transaction } from '../../_components/interfaces/statement-panel.interfaces';

export type AccountRequestStatus = 'idle' | 'loading' | 'ready' | 'error';

export type AccountData = {
  balance: number;
  transactions: Transaction[];
};

export type AccountRequestState = {
  status: AccountRequestStatus;
  errorMessage: string | null;
};

export type AccountState = {
  data: AccountData;
  request: AccountRequestState;
};

export type FinancialVisibilityData = {
  balance: number;
  depositsTotal: number;
  transfersTotal: number;
  transactions: Transaction[];
};
