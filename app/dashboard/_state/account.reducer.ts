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
      nextAmountInCents: number;
      nextType: StatementEntryType;
      nextMonth: string;
      nextDate: string;
    };

function centsToReais(amountInCents: number): number {
  return Math.round(amountInCents) / 100;
}

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
        currentBalance: roundToCentsPrecision(
          state.currentBalance + centsToReais(action.entry.amountInCents)
        ),
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
        currentBalance: roundToCentsPrecision(
          state.currentBalance - centsToReais(entryToDelete.amountInCents)
        ),
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

      const normalizedAmountInCents =
        action.nextType === StatementEntryType.TRANSFER
          ? -Math.abs(action.nextAmountInCents)
          : Math.abs(action.nextAmountInCents);

      return {
        currentBalance: roundToCentsPrecision(
          state.currentBalance -
            centsToReais(entryToEdit.amountInCents) +
            centsToReais(normalizedAmountInCents)
        ),
        currentStatementEntries: state.currentStatementEntries.map((entry) =>
          entry.id === action.entryId
            ? {
                ...entry,
                type: action.nextType,
                amountInCents: normalizedAmountInCents,
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
