import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TransactionModal } from './transaction-modal';
import { TransactionType } from './interfaces/statement-panel.interfaces';

const baseEntry = {
  id: 1,
  type: TransactionType.DEPOSIT,
  date: '2022-11-18T12:00:00.000Z',
  value: 150,
};

describe('TransactionModal — modo edição', () => {
  it('preenche formulario com valores iniciais do lancamento', () => {
    render(
      <TransactionModal
        entry={{
          ...baseEntry,
          type: TransactionType.TRANSFER,
          value: 500,
          date: '2022-11-21T12:00:00.000Z',
        }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('combobox', { name: /Tipo de trans/i })).toHaveValue(
      TransactionType.TRANSFER
    );
    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveValue('500,00');
    expect(screen.getByLabelText('Data')).toHaveValue('2022-11-21');
  });

  it('usa data padrao quando a data inicial vem em formato invalido', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-21T15:00:00.000Z'));

    try {
      const { rerender } = render(
        <TransactionModal entry={{ ...baseEntry, date: 'data-invalida' }} onClose={vi.fn()} />
      );

      expect(screen.getByLabelText('Data')).toHaveValue('2026-04-21');

      rerender(
        <TransactionModal entry={{ ...baseEntry, date: '21/04' }} onClose={vi.fn()} />
      );

      expect(screen.getByLabelText('Data')).toHaveValue('2026-04-21');

      rerender(
        <TransactionModal entry={{ ...baseEntry, date: '21/04/aaaa' }} onClose={vi.fn()} />
      );

      expect(screen.getByLabelText('Data')).toHaveValue('2026-04-21');
    } finally {
      vi.useRealTimers();
    }
  });

  it('nao envia submit quando formulario esta invalido', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(<TransactionModal entry={baseEntry} onClose={onClose} onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /Salvar/i });
    const form = submitButton.closest('form');
    if (!form) throw new Error('Formulario nao encontrado');

    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), {
      target: { value: '0' },
    });

    fireEvent.submit(form);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('fecha no clique do backdrop e ignora clique interno', () => {
    const onClose = vi.fn();

    render(<TransactionModal entry={baseEntry} onClose={onClose} />);

    fireEvent.click(screen.getByText(/Editar trans/i));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('exibe alerta de erro e permite fechar o alerta', async () => {
    const onSubmit = vi.fn(() => ({
      ok: false as const,
      message: 'Saldo insuficiente para concluir a transferência.',
    }));

    render(<TransactionModal entry={baseEntry} onClose={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Data'), {
      target: { value: '2026-04-21' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Salvar/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Saldo insuficiente');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Fechar alerta' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('fecha com tecla Escape, botao fechar e cancelar', () => {
    const onClose = vi.fn();

    render(<TransactionModal entry={baseEntry} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: /Fechar/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe('TransactionModal — modo novo', () => {
  it('renderiza titulo e botao corretos no modo novo', () => {
    render(<TransactionModal onClose={vi.fn()} />);

    expect(screen.getByText('Nova transação')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
  });

  it('exibe placeholder no select de tipo no modo novo', () => {
    render(<TransactionModal onClose={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: /Tipo de trans/i })).toHaveValue('');
  });

  it('seleciona transferencia quando o valor recebe o sinal de menos', () => {
    render(<TransactionModal onClose={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Valor' }), {
      target: { value: '-100' },
    });

    expect(screen.getByRole('combobox', { name: /Tipo de trans/i })).toHaveValue(
      TransactionType.TRANSFER
    );
    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveValue('1,00');
  });

  it('nao envia submit quando tipo nao foi selecionado', () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();

    render(<TransactionModal onClose={onClose} onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: 'Adicionar' });
    fireEvent.submit(submitButton.closest('form')!);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('fecha com tecla Escape, botao fechar e cancelar', () => {
    const onClose = vi.fn();

    render(<TransactionModal onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: /Fechar/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
