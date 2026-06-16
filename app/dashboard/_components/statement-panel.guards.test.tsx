import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatementPanel } from './statement-panel';
import { StatementEntryType } from './interfaces/statement-panel.interfaces';

const onDeleteStatementEntryMock = vi.fn();
const onEditStatementEntryMock = vi.fn();

vi.mock('@/app/context/auth-session-context', () => ({
  useAuthSessionContext: () => ({
    statementEntries: [],
    onDeleteStatementEntry: onDeleteStatementEntryMock,
    onEditStatementEntry: onEditStatementEntryMock,
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
    onDeleteStatementEntryMock.mockReset();
    onEditStatementEntryMock.mockReset();
  });

  it('ignora acoes de editar e excluir quando nao existe lancamento selecionado', () => {
    render(
      <StatementPanel
        entries={[
          {
            id: '1',
            month: 'Novembro',
            type: StatementEntryType.DEPOSIT,
            amount: 150,
            date: '18/11/2022',
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar extrato' }));
    fireEvent.click(screen.getByRole('button', { name: 'Excluir extrato' }));

    expect(onEditStatementEntryMock).not.toHaveBeenCalled();
    expect(onDeleteStatementEntryMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: /Editar trans/i })).not.toBeInTheDocument();
  });
});
