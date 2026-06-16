import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NewTransactionPanel } from './new-transaction-panel';
import { TransactionType, type NewTransactionResult } from './interfaces/new-transaction-panel.interfaces';

const onSubmitTransactionMock = vi.fn<
  [
    payload: {
      type: TransactionType;
      value: number;
      transactionDate: string;
    },
  ],
  NewTransactionResult
>();

vi.mock('@/app/context/auth-session-context', () => ({
  useAuthSessionContext: () => ({
    onSubmitTransaction: onSubmitTransactionMock,
  }),
}));

describe('NewTransactionPanel', () => {
  beforeEach(() => {
    onSubmitTransactionMock.mockReset();
    onSubmitTransactionMock.mockReturnValue({ ok: true });
  });

  it('renderiza estrutura base do formulario e comeca com botao desabilitado', () => {
    render(<NewTransactionPanel />);

    expect(screen.getByRole('heading', { name: 'Nova transa\u00e7\u00e3o', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Tipo de transa\u00e7\u00e3o' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Valor' })).toHaveValue('00,00');
    expect(screen.getByLabelText('Data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir transa\u00e7\u00e3o' })).toBeDisabled();
  });

  it('aplica mascara de moeda ao digitar o valor', () => {
    render(<NewTransactionPanel />);

    const amountInput = screen.getByRole('textbox', { name: 'Valor' });
    fireEvent.change(amountInput, { target: { value: '123456' } });

    expect(amountInput).toHaveValue('1.234,56');
  });

  it('habilita botao somente quando tipo e valor sao validos', () => {
    render(<NewTransactionPanel />);

    const submitButton = screen.getByRole('button', { name: 'Concluir transa\u00e7\u00e3o' });
    const typeSelect = screen.getByRole('combobox', { name: 'Tipo de transa\u00e7\u00e3o' });
    const amountInput = screen.getByRole('textbox', { name: 'Valor' });

    fireEvent.change(amountInput, { target: { value: '0' } });
    expect(submitButton).toBeDisabled();

    fireEvent.change(typeSelect, { target: { value: TransactionType.DEPOSIT } });
    expect(submitButton).toBeDisabled();

    fireEvent.change(amountInput, { target: { value: '1' } });
    expect(submitButton).toBeEnabled();
  });

  it('mantem submit desabilitado quando data esta fora do intervalo permitido', () => {
    render(<NewTransactionPanel />);

    const submitButton = screen.getByRole('button', { name: 'Concluir transa\u00e7\u00e3o' });
    const typeSelect = screen.getByRole('combobox', { name: 'Tipo de transa\u00e7\u00e3o' });
    const amountInput = screen.getByRole('textbox', { name: 'Valor' });
    const dateInput = screen.getByLabelText('Data');

    fireEvent.change(typeSelect, { target: { value: TransactionType.DEPOSIT } });
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(dateInput, { target: { value: '275760-04-19' } });
    fireEvent.blur(dateInput);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/Informe uma data entre/i)).toBeInTheDocument();
  });

  it('previne submit padrao do formulario', () => {
    render(<NewTransactionPanel />);

    const submitButton = screen.getByRole('button', { name: 'Concluir transa\u00e7\u00e3o' });
    const typeSelect = screen.getByRole('combobox', { name: 'Tipo de transa\u00e7\u00e3o' });
    const amountInput = screen.getByRole('textbox', { name: 'Valor' });
    const form = submitButton.closest('form');

    if (!form) {
      throw new Error('Formulario nao encontrado');
    }

    fireEvent.change(typeSelect, { target: { value: TransactionType.DEPOSIT } });
    fireEvent.change(amountInput, { target: { value: '999' } });

    const submitEvent = createEvent.submit(form, { cancelable: true });
    fireEvent(form, submitEvent);

    expect(submitEvent.defaultPrevented).toBe(true);
  });

  it('ignora submit quando tipo da transacao e invalido ou vazio', () => {
    render(<NewTransactionPanel />);

    const submitButton = screen.getByRole('button', { name: 'Concluir transa\u00e7\u00e3o' });
    const amountInput = screen.getByRole('textbox', { name: 'Valor' });
    const form = submitButton.closest('form');

    if (!form) {
      throw new Error('Formulario nao encontrado');
    }

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.submit(form);

    expect(onSubmitTransactionMock).not.toHaveBeenCalled();
  });

  it('ignora valor invalido no select e mantem ultimo tipo valido', () => {
    render(<NewTransactionPanel />);

    const typeSelect = screen.getByRole('combobox', { name: 'Tipo de transa\u00e7\u00e3o' });
    const invalidOption = document.createElement('option');
    invalidOption.value = 'pix';
    invalidOption.textContent = 'Pix';
    typeSelect.appendChild(invalidOption);

    fireEvent.change(typeSelect, { target: { value: TransactionType.DEPOSIT } });
    expect(typeSelect).toHaveValue(TransactionType.DEPOSIT);

    fireEvent.change(typeSelect, { target: { value: 'pix' } });
    expect(typeSelect).toHaveValue(TransactionType.DEPOSIT);
  });

  it('envia o valor em reais e reseta o formulario no submit valido', () => {
    render(<NewTransactionPanel />);

    const submitButton = screen.getByRole('button', { name: 'Concluir transa\u00e7\u00e3o' });
    const typeSelect = screen.getByRole('combobox', { name: 'Tipo de transa\u00e7\u00e3o' });
    const amountInput = screen.getByRole('textbox', { name: 'Valor' });
    const dateInput = screen.getByLabelText('Data');

    fireEvent.change(typeSelect, { target: { value: TransactionType.DEPOSIT } });
    fireEvent.change(amountInput, { target: { value: '123456' } });
    fireEvent.change(dateInput, { target: { value: '2026-04-19' } });
    fireEvent.click(submitButton);

    expect(onSubmitTransactionMock).toHaveBeenCalledWith({
      type: TransactionType.DEPOSIT,
      value: 1234.56,
      transactionDate: '2026-04-19',
    });
    expect(typeSelect).toHaveValue('');
    expect(amountInput).toHaveValue('00,00');
  });

  it('mostra alerta de erro e mantem os dados quando transacao e bloqueada', () => {
    onSubmitTransactionMock.mockReturnValue({
      ok: false,
      message: 'Saldo insuficiente para concluir a transfer\u00eancia.',
    });

    render(<NewTransactionPanel />);

    const submitButton = screen.getByRole('button', { name: 'Concluir transa\u00e7\u00e3o' });
    const typeSelect = screen.getByRole('combobox', { name: 'Tipo de transa\u00e7\u00e3o' });
    const amountInput = screen.getByRole('textbox', { name: 'Valor' });

    fireEvent.change(typeSelect, { target: { value: TransactionType.TRANSFER } });
    fireEvent.change(amountInput, { target: { value: '300000' } });
    fireEvent.click(submitButton);

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Saldo insuficiente para concluir a transfer\u00eancia.'
    );
    expect(typeSelect).toHaveValue(TransactionType.TRANSFER);
    expect(amountInput).toHaveValue('3.000,00');
  });

  it('nao envia transacao quando valor ou data sao invalidos', () => {
    render(<NewTransactionPanel />);

    const submitButton = screen.getByRole('button', { name: 'Concluir transa\u00e7\u00e3o' });
    const form = submitButton.closest('form');
    const typeSelect = screen.getByRole('combobox', { name: 'Tipo de transa\u00e7\u00e3o' });
    const amountInput = screen.getByRole('textbox', { name: 'Valor' });
    const dateInput = screen.getByLabelText('Data');

    if (!form) {
      throw new Error('Formulario nao encontrado');
    }

    fireEvent.change(typeSelect, { target: { value: TransactionType.DEPOSIT } });
    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.submit(form);
    expect(onSubmitTransactionMock).not.toHaveBeenCalled();

    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(dateInput, { target: { value: '275760-04-19' } });
    fireEvent.submit(form);
    expect(onSubmitTransactionMock).not.toHaveBeenCalled();
  });
});
