import { describe, expect, it } from 'vitest';
import {
  AccountActionType,
  accountReducer,
  createAccountState,
  type AccountAction,
} from './account.reducer';
import { StatementEntryType } from '../_components/interfaces/statement-panel.interfaces';

const baseEntries = [
  {
    id: '1',
    month: 'Novembro',
    type: StatementEntryType.DEPOSIT,
    amount: 150,
    date: '18/11/2022',
  },
  {
    id: '2',
    month: 'Novembro',
    type: StatementEntryType.TRANSFER,
    amount: -50,
    date: '21/11/2022',
  },
] as const;

describe('account.reducer', () => {
  it('cria estado inicial com clone do extrato', () => {
    const state = createAccountState(2500, baseEntries);

    expect(state.currentBalance).toBe(2500);
    expect(state.currentStatementEntries).toEqual(baseEntries);
    expect(state.currentStatementEntries).not.toBe(baseEntries);
  });

  it('hidrata estado a partir das props', () => {
    const initialState = createAccountState(1, []);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.HYDRATE_FROM_PROPS,
      balance: 2500,
      statementEntries: baseEntries,
    });

    expect(nextState.currentBalance).toBe(2500);
    expect(nextState.currentStatementEntries).toEqual(baseEntries);
  });

  it('adiciona lancamento e atualiza saldo', () => {
    const initialState = createAccountState(2500, baseEntries);
    const newEntry = {
      id: '3',
      month: 'Novembro',
      type: StatementEntryType.DEPOSIT,
      amount: 70,
      date: '21/11/2022',
    };

    const nextState = accountReducer(initialState, {
      type: AccountActionType.APPEND_TRANSACTION_ENTRY,
      entry: newEntry,
    });

    expect(nextState.currentBalance).toBe(2570);
    expect(nextState.currentStatementEntries[0]).toEqual(newEntry);
  });

  it('remove lancamento existente e reverte saldo', () => {
    const initialState = createAccountState(2500, baseEntries);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.DELETE_STATEMENT_ENTRY,
      entryId: '2',
    });

    expect(nextState.currentBalance).toBe(2550);
    expect(nextState.currentStatementEntries).toHaveLength(1);
    expect(nextState.currentStatementEntries[0]?.id).toBe('1');
  });

  it('mantem estado quando delete recebe id inexistente', () => {
    const initialState = createAccountState(2500, baseEntries);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.DELETE_STATEMENT_ENTRY,
      entryId: 'inexistente',
    });

    expect(nextState).toBe(initialState);
  });

  it('edita transferencia normalizando para valor negativo', () => {
    const initialState = createAccountState(2500, baseEntries);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.EDIT_STATEMENT_ENTRY,
      entryId: '2',
      nextAmount: 70,
      nextType: StatementEntryType.TRANSFER,
      nextMonth: 'Dezembro',
      nextDate: '10/12/2022',
    });

    expect(nextState.currentBalance).toBe(2480);
    const editedTransfer = nextState.currentStatementEntries.find((entry) => entry.id === '2');
    expect(editedTransfer?.amount).toBe(-70);
    expect(editedTransfer?.type).toBe(StatementEntryType.TRANSFER);
    expect(editedTransfer?.month).toBe('Dezembro');
    expect(editedTransfer?.date).toBe('10/12/2022');
  });

  it('edita deposito normalizando para valor positivo', () => {
    const initialState = createAccountState(2500, baseEntries);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.EDIT_STATEMENT_ENTRY,
      entryId: '1',
      nextAmount: -200,
      nextType: StatementEntryType.DEPOSIT,
      nextMonth: 'Janeiro',
      nextDate: '02/01/2023',
    });

    expect(nextState.currentBalance).toBe(2550);
    const editedDeposit = nextState.currentStatementEntries.find((entry) => entry.id === '1');
    expect(editedDeposit?.amount).toBe(200);
    expect(editedDeposit?.type).toBe(StatementEntryType.DEPOSIT);
    expect(editedDeposit?.month).toBe('Janeiro');
    expect(editedDeposit?.date).toBe('02/01/2023');
  });

  it('mantem estado quando edit recebe id inexistente', () => {
    const initialState = createAccountState(2500, baseEntries);

    const nextState = accountReducer(initialState, {
      type: AccountActionType.EDIT_STATEMENT_ENTRY,
      entryId: 'inexistente',
      nextAmount: 1,
      nextType: StatementEntryType.DEPOSIT,
      nextMonth: 'Novembro',
      nextDate: '18/11/2022',
    });

    expect(nextState).toBe(initialState);
  });

  it('retorna estado atual para acao desconhecida', () => {
    const initialState = createAccountState(2500, baseEntries);

    const nextState = accountReducer(initialState, {
      type: 'acao-desconhecida',
    } as unknown as AccountAction);

    expect(nextState).toBe(initialState);
  });
});
