import {
  StatementEntryType,
  type StatementEntry,
} from '../_components/interfaces/statement-panel.interfaces';

export enum AccountActionType {
  HYDRATE_FROM_PROPS = 'hydrate-from-props',
  APPEND_TRANSACTION_ENTRY = 'append-transaction-entry',
  DELETE_STATEMENT_ENTRY = 'delete-statement-entry',
  EDIT_STATEMENT_ENTRY = 'edit-statement-entry',
}

export type AccountState = {
  currentBalance: number;
  currentStatementEntries: StatementEntry[];
};

export type AccountAction =
  | {
      type: AccountActionType.HYDRATE_FROM_PROPS;
      balance: number;
      statementEntries: readonly StatementEntry[];
    }
  | {
      type: AccountActionType.APPEND_TRANSACTION_ENTRY;
      entry: StatementEntry;
    }
  | {
      type: AccountActionType.DELETE_STATEMENT_ENTRY;
      entryId: string;
    }
  | {
      type: AccountActionType.EDIT_STATEMENT_ENTRY;
      entryId: string;
      nextAmount: number;
      nextType: StatementEntryType;
      nextMonth: string;
      nextDate: string;
    };

function roundToCentsPrecision(value: number): number {
  return Math.round(value * 100) / 100;
}

export function createAccountState(
  balance: number,
  statementEntries: readonly StatementEntry[]
): AccountState {
  return {
    currentBalance: balance,
    currentStatementEntries: [...statementEntries],
  };
}

export function accountReducer(state: AccountState, action: AccountAction): AccountState {
  switch (action.type) {
    case AccountActionType.HYDRATE_FROM_PROPS:
      return createAccountState(action.balance, action.statementEntries);

    case AccountActionType.APPEND_TRANSACTION_ENTRY:
      return {
        currentBalance: roundToCentsPrecision(state.currentBalance + action.entry.amount),
        currentStatementEntries: [action.entry, ...state.currentStatementEntries],
      };

    case AccountActionType.DELETE_STATEMENT_ENTRY: {
      const entryToDelete = state.currentStatementEntries.find(
        (entry) => entry.id === action.entryId
      );
      if (!entryToDelete) {
        return state;
      }

      return {
        currentBalance: roundToCentsPrecision(state.currentBalance - entryToDelete.amount),
        currentStatementEntries: state.currentStatementEntries.filter(
          (entry) => entry.id !== action.entryId
        ),
      };
    }

    case AccountActionType.EDIT_STATEMENT_ENTRY: {
      const entryToEdit = state.currentStatementEntries.find(
        (entry) => entry.id === action.entryId
      );
      if (!entryToEdit) {
        return state;
      }

      const normalizedAmount =
        action.nextType === StatementEntryType.TRANSFER
          ? -Math.abs(action.nextAmount)
          : Math.abs(action.nextAmount);

      return {
        currentBalance: roundToCentsPrecision(
          state.currentBalance - entryToEdit.amount + normalizedAmount
        ),
        currentStatementEntries: state.currentStatementEntries.map((entry) =>
          entry.id === action.entryId
            ? {
                ...entry,
                type: action.nextType,
                amount: normalizedAmount,
                month: action.nextMonth,
                date: action.nextDate,
              }
            : entry
        ),
      };
    }

    default:
      return state;
  }
}
