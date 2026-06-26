import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateInput } from './date-input';

describe('DateInput', () => {
  it('renderiza label e input associados', () => {
    render(<DateInput label="Data início" id="start" name="start" value="" onChange={vi.fn()} />);

    const input = screen.getByLabelText('Data início');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'date');
  });

  it('propaga valor ao mudar', () => {
    const onChange = vi.fn();
    render(<DateInput label="Data" id="date" name="date" value="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Data'), { target: { value: '2026-06-01' } });
    expect(onChange).toHaveBeenCalledWith('2026-06-01');
  });

  it('aplica min e max ao input', () => {
    render(
      <DateInput
        label="Data"
        id="date"
        name="date"
        value=""
        min="2026-01-01"
        max="2026-12-31"
        onChange={vi.fn()}
      />
    );

    const input = screen.getByLabelText('Data');
    expect(input).toHaveAttribute('min', '2026-01-01');
    expect(input).toHaveAttribute('max', '2026-12-31');
  });

  it('usa id como fallback quando id nao e fornecido', () => {
    render(<DateInput label="Data" name="my-date" value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText('Data')).toHaveAttribute('id', 'my-date');
  });

  it('aplica classes customizadas no container, label e input', () => {
    const { container } = render(
      <DateInput
        label="Data"
        id="date"
        name="date"
        value=""
        onChange={vi.fn()}
        containerClassName="custom-container"
        labelClassName="custom-label"
        inputClassName="custom-input"
      />
    );

    expect(container.firstChild).toHaveClass('custom-container');
    expect(screen.getByText('Data')).toHaveClass('custom-label');
    expect(screen.getByLabelText('Data')).toHaveClass('custom-input');
  });

  it('desabilita o input quando disabled e fornecido', () => {
    render(<DateInput label="Data" id="date" name="date" value="" onChange={vi.fn()} disabled />);

    expect(screen.getByLabelText('Data')).toBeDisabled();
  });
});
