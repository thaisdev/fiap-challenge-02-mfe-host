import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FileInput, fileInputClasses } from './file-input';

describe('fileInputClasses', () => {
  it('gera as classes base do input', () => {
    const classes = fileInputClasses();

    expect(classes).toContain('border-border');
    expect(classes).toContain('focus-visible:ring-primary');
    expect(classes).toContain('cursor-pointer');
  });

  it('concatena className customizada', () => {
    const classes = fileInputClasses({ className: 'border-primary' });

    expect(classes).toContain('border-primary');
  });
});

describe('FileInput', () => {
  it('usa o name como fallback para htmlFor/id', () => {
    render(<FileInput label="Comprovante" name="comprovante" />);

    const input = screen.getByLabelText('Comprovante');
    expect(input).toHaveAttribute('id', 'comprovante');
  });

  it('respeita id informado', () => {
    render(<FileInput label="Comprovante" id="arquivo" name="arquivo" />);

    expect(screen.getByLabelText('Comprovante')).toHaveAttribute('id', 'arquivo');
  });

  it('aplica classes customizadas no container e no input', () => {
    const { container } = render(
      <FileInput
        label="Comprovante"
        name="comprovante"
        containerClassName="mt-8"
        inputClassName="border-primary"
      />
    );

    expect(container.firstChild).toHaveClass('mt-8');
    expect(screen.getByLabelText('Comprovante').className).toContain('border-primary');
  });

  it('exibe nome do arquivo apos selecao', () => {
    render(<FileInput label="Comprovante" name="comprovante" />);

    const input = screen.getByLabelText('Comprovante');
    const file = new File(['conteudo'], 'recibo.pdf', { type: 'application/pdf' });

    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);

    expect(screen.getByText('recibo.pdf')).toBeInTheDocument();
  });

  it('nao exibe nome do arquivo antes de selecao', () => {
    render(<FileInput label="Comprovante" name="comprovante" />);

    expect(screen.queryByText(/\.pdf|\.png|\.jpg/i)).not.toBeInTheDocument();
  });

  it('exibe botao de remover arquivo somente apos selecao', () => {
    render(<FileInput label="Comprovante" name="comprovante" />);

    expect(screen.queryByRole('button', { name: /remover arquivo/i })).not.toBeInTheDocument();

    const input = screen.getByLabelText('Comprovante');
    const file = new File(['conteudo'], 'recibo.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);

    expect(screen.getByRole('button', { name: /remover arquivo/i })).toBeInTheDocument();
  });

  it('limpa o nome do arquivo ao clicar em remover', () => {
    render(<FileInput label="Comprovante" name="comprovante" />);

    const input = screen.getByLabelText('Comprovante');
    const file = new File(['conteudo'], 'recibo.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: [file], configurable: true });
    fireEvent.change(input);

    fireEvent.click(screen.getByRole('button', { name: /remover arquivo/i }));

    expect(screen.queryByText('recibo.pdf')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remover arquivo/i })).not.toBeInTheDocument();
  });

  it('repassa handler onChange externo', () => {
    const onChange = vi.fn();
    render(<FileInput label="Comprovante" name="comprovante" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Comprovante'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('repassa accept para o input nativo', () => {
    render(<FileInput label="Comprovante" name="comprovante" accept="image/*,.pdf" />);

    expect(screen.getByLabelText('Comprovante')).toHaveAttribute('accept', 'image/*,.pdf');
  });
});
