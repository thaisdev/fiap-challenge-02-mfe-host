import {
  TransactionType,
  type Transaction,
} from '../_components/interfaces/statement-panel.interfaces';

export enum AccountActionType {
  HYDRATE_FROM_PROPS = 'hydrate-from-props',
  APPEND_TRANSACTION = 'append-transaction',
  DELETE_TRANSACTION = 'delete-transaction',
  EDIT_TRANSACTION = 'edit-transaction',
}

export type AccountState = {
  balance: number;
  transactions: Transaction[];
};

export type AccountAction =
  | {
      type: AccountActionType.HYDRATE_FROM_PROPS;
      balance: number;
      transactions: readonly Transaction[];
    }
  | {
      type: AccountActionType.APPEND_TRANSACTION;
      transaction: Transaction;
    }
  | {
      type: AccountActionType.DELETE_TRANSACTION;
      transactionId: number;
    }
  | {
      type: AccountActionType.EDIT_TRANSACTION;
      transactionId: number;
      nextValue: number;
      nextType: TransactionType;
      nextDate: string;
    };

function signedValue(type: TransactionType, value: number): number {
  return type === TransactionType.TRANSFER ? -Math.abs(value) : Math.abs(value);
}

function roundToCentsPrecision(value: number): number {
  return Math.round(value * 100) / 100;
}

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

    case AccountActionType.APPEND_TRANSACTION:
      return {
        balance: roundToCentsPrecision(
          state.balance + signedValue(action.transaction.type, action.transaction.value)
        ),
        transactions: [action.transaction, ...state.transactions],
      };

    case AccountActionType.DELETE_TRANSACTION: {
      const transactionToDelete = state.transactions.find(
        (transaction) => transaction.id === action.transactionId
      );
      if (!transactionToDelete) {
        return state;
      }

      return {
        balance: roundToCentsPrecision(
          state.balance - signedValue(transactionToDelete.type, transactionToDelete.value)
        ),
        transactions: state.transactions.filter(
          (transaction) => transaction.id !== action.transactionId
        ),
      };
    }

    case AccountActionType.EDIT_TRANSACTION: {
      const transactionToEdit = state.transactions.find(
        (transaction) => transaction.id === action.transactionId
      );
      if (!transactionToEdit) {
        return state;
      }

      const nextValue = Math.abs(action.nextValue);

      return {
        balance: roundToCentsPrecision(
          state.balance -
            signedValue(transactionToEdit.type, transactionToEdit.value) +
            signedValue(action.nextType, nextValue)
        ),
        transactions: state.transactions.map((transaction) =>
          transaction.id === action.transactionId
            ? {
                ...transaction,
                type: action.nextType,
                value: nextValue,
                date: action.nextDate,
              }
            : transaction
        ),
      };
    }

    default:
      return state;
  }
}
