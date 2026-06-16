import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StatementPanel } from './statement-panel';
import { StatementEntryType, TransactionType } from './interfaces/statement-panel.interfaces';

const onDeleteStatementEntryMock = vi.fn();
const onEditStatementEntryMock = vi.fn();

vi.mock('@/app/context/auth-session-context', () => ({
  useAuthSessionContext: () => ({
    statementEntries: [],
    onDeleteStatementEntry: onDeleteStatementEntryMock,
    onEditStatementEntry: onEditStatementEntryMock,
  }),
}));

function getEntryByDate(date: string) {
  const entry = screen.getByText(date).closest('li');
  if (!entry) {
    throw new Error(`Lancamento nao encontrado para data ${date}`);
  }

  return entry;
}

describe('StatementPanel', () => {
  beforeEach(() => {
    onDeleteStatementEntryMock.mockReset();
    onEditStatementEntryMock.mockReset();
    onEditStatementEntryMock.mockReturnValue({ ok: true as const });
  });

  it('renderiza titulo e lancamentos do extrato e habilita acoes ao selecionar item', () => {
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
          {
            id: '2',
            month: 'Novembro',
            type: StatementEntryType.TRANSFER,
            amount: -500,
            date: '21/11/2022',
          },
        ]}
      />
    );

    const editButton = screen.getByRole('button', { name: 'Editar extrato' });
    const deleteButton = screen.getByRole('button', { name: 'Excluir extrato' });

    expect(screen.getByRole('heading', { name: 'Extrato', level: 2 })).toBeInTheDocument();
    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
    expect(screen.getAllByText('Novembro')).toHaveLength(2);
    expect(screen.getByText(/Dep/i)).toBeInTheDocument();
    expect(screen.getByText(/Transfer/i)).toBeInTheDocument();

    fireEvent.click(getEntryByDate('18/11/2022'));
    expect(editButton).toBeEnabled();
    expect(deleteButton).toBeEnabled();
  });

  it('oculta botoes quando showActions e falso', () => {
    render(
      <StatementPanel
        showActions={false}
        entries={[
          {
            id: '1',
            month: 'Abril',
            type: StatementEntryType.DEPOSIT,
            amount: 10,
            date: '21/04/2026',
          },
        ]}
      />
    );

    expect(screen.getByText(/Dep/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Editar extrato' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir extrato' })).not.toBeInTheDocument();
  });

  it('abre modal de edicao e envia payload completo de tipo, valor e data', () => {
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

    fireEvent.click(getEntryByDate('18/11/2022'));
    fireEvent.click(screen.getByRole('button', { name: 'Editar extrato' }));

    expect(screen.getByRole('heading', { name: /Editar trans/i })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Tipo de trans/i })).toHaveValue(
      TransactionType.DEPOSIT
    );
    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveValue('150,00');

    fireEvent.change(screen.getByRole('combobox', { name: /Tipo de trans/i }), {
      target: { value: TransactionType.TRANSFER },
    });
    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), {
      target: { value: '70000' },
    });
    fireEvent.change(screen.getByLabelText('Data'), {
      target: { value: '2026-04-22' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar edi/i }));

    expect(onEditStatementEntryMock).toHaveBeenCalledWith({
      entryId: '1',
      type: TransactionType.TRANSFER,
      amount: 700,
      transactionDate: '2026-04-22',
    });
    expect(screen.queryByRole('heading', { name: /Editar trans/i })).not.toBeInTheDocument();
  });

  it('mantem modal aberto e mostra alerta quando a edicao retorna erro', () => {
    onEditStatementEntryMock.mockReturnValue({
      ok: false as const,
      message: 'Saldo insuficiente para concluir a transferencia.',
    });

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

    fireEvent.click(getEntryByDate('18/11/2022'));
    fireEvent.click(screen.getByRole('button', { name: 'Editar extrato' }));
    fireEvent.change(screen.getByLabelText('Data'), {
      target: { value: '2026-04-21' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar edi/i }));

    expect(onEditStatementEntryMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent('Saldo insuficiente');
    expect(screen.getByRole('heading', { name: /Editar trans/i })).toBeInTheDocument();
  });

  it('deseleciona lancamento ao clicar fora do painel e bloqueia botoes novamente', () => {
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

    const editButton = screen.getByRole('button', { name: 'Editar extrato' });
    const deleteButton = screen.getByRole('button', { name: 'Excluir extrato' });

    fireEvent.click(getEntryByDate('18/11/2022'));
    expect(editButton).toBeEnabled();
    expect(deleteButton).toBeEnabled();

    fireEvent.mouseDown(document.body);
    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  it('ignora evento global quando target nao eh um Node', () => {
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

    const event = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(event, 'target', {
      value: { arbitrary: true },
      configurable: true,
    });

    document.dispatchEvent(event);

    expect(screen.getByRole('button', { name: 'Editar extrato' })).toBeDisabled();
  });

  it('mantem selecao quando o clique acontece dentro do painel', () => {
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

    const editButton = screen.getByRole('button', { name: 'Editar extrato' });

    fireEvent.click(getEntryByDate('18/11/2022'));
    expect(editButton).toBeEnabled();

    fireEvent.mouseDown(screen.getByLabelText('Extrato da conta'));
    expect(editButton).toBeEnabled();
  });

  it('cobre guards de edit e delete quando nao ha item selecionado', () => {
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

    const editButton = screen.getByRole('button', { name: 'Editar extrato' });
    const deleteButton = screen.getByRole('button', { name: 'Excluir extrato' });

    editButton.removeAttribute('disabled');
    deleteButton.removeAttribute('disabled');
    (editButton as HTMLButtonElement).disabled = false;
    (deleteButton as HTMLButtonElement).disabled = false;

    fireEvent.click(editButton);
    fireEvent.click(deleteButton);

    expect(onEditStatementEntryMock).not.toHaveBeenCalled();
    expect(onDeleteStatementEntryMock).not.toHaveBeenCalled();
  });

  it('fecha modal com Escape e exclui item selecionado', () => {
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

    fireEvent.click(getEntryByDate('18/11/2022'));
    fireEvent.click(screen.getByRole('button', { name: 'Editar extrato' }));
    expect(screen.getByRole('heading', { name: /Editar trans/i })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('heading', { name: /Editar trans/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Excluir extrato' }));
    expect(onDeleteStatementEntryMock).toHaveBeenCalledWith('1');
  });
});
