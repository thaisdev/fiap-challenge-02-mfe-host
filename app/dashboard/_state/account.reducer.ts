import type { Transaction } from '../_components/interfaces/statement-panel.interfaces';

export enum AccountActionType {
  HYDRATE_FROM_PROPS = 'hydrate-from-props',
}

export type AccountState = {
  balance: number;
  transactions: Transaction[];
};

export type AccountAction = {
  type: AccountActionType.HYDRATE_FROM_PROPS;
  balance: number;
  transactions: readonly Transaction[];
};

export function createAccountState(
  balance: number,
  transactions: readonly Transaction[]
): AccountState {
  return {
    balance,
    transactions: [...transactions],
  };
}

export function accountReducer(state: AccountState, action: AccountAction): AccountState {
  switch (action.type) {
    case AccountActionType.HYDRATE_FROM_PROPS:
      return createAccountState(action.balance, action.transactions);

    default:
      return state;
  }
}
