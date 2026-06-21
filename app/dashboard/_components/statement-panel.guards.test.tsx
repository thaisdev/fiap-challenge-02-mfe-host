import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatementPanel } from './statement-panel';
import { TransactionType } from './interfaces/statement-panel.interfaces';

const onDeleteTransactionMock = vi.fn();
const onEditTransactionMock = vi.fn();

vi.mock('../_store/account/account.hooks', () => ({
  useAccount: () => ({
    transactions: [],
  }),
  useAccountActions: () => ({
    onDeleteTransaction: onDeleteTransactionMock,
    onEditTransaction: onEditTransactionMock,
  }),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    disabled: _disabled,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => {
    void _disabled;

    return (
      <button type="button" {...props}>
        {children}
      </button>
    );
  },
}));

describe('StatementPanel guards', () => {
  beforeEach(() => {
    onDeleteTransactionMock.mockReset();
    onEditTransactionMock.mockReset();
  });

  it('ignora acoes de editar e excluir quando nao existe lancamento selecionado', () => {
    render(
      <StatementPanel
        entries={[
          {
            id: 1,
            type: TransactionType.DEPOSIT,
            date: '2022-11-18T12:00:00.000Z',
            value: 150,
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar extrato' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir extrato' }));

    expect(onEditTransactionMock).not.toHaveBeenCalled();
    expect(onDeleteTransactionMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: /Editar trans/i })).not.toBeInTheDocument();
  });
});
