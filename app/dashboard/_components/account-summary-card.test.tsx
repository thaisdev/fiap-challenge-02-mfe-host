import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountSummaryCard } from './account-summary-card';

describe('AccountSummaryCard', () => {
  it('renderiza dados principais do resumo da conta', () => {
    render(
      <AccountSummaryCard
        name="Joana"
        dateLabel="Quinta-feira, 08/09/2024"
        balanceLabel="Saldo"
        accountLabel="Conta corrente"
        balanceInCents={250000}
        isBalanceVisible
        balanceLoading={false}
        onToggleBalanceVisibility={() => {}}
      />
    );

    expect(screen.getByRole('heading', { name: /Ol[a\u00e1], Joana! :\)/i })).toBeInTheDocument();
    expect(screen.getByText('Quinta-feira, 08/09/2024')).toBeInTheDocument();
    expect(screen.getByText('Saldo')).toBeInTheDocument();
    expect(screen.getByText('Conta corrente')).toBeInTheDocument();
    expect(screen.getByText('R$ 2.500,00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ocultar saldo' })).toBeInTheDocument();
  });

  it('oculta saldo e aciona callback do botao de visibilidade', () => {
    const onToggleBalanceVisibility = vi.fn();

    render(
      <AccountSummaryCard
        name="Joana"
        dateLabel="Quinta-feira, 08/09/2024"
        balanceLabel="Saldo"
        accountLabel="Conta corrente"
        balanceInCents={250000}
        isBalanceVisible={false}
        balanceLoading={false}
        onToggleBalanceVisibility={onToggleBalanceVisibility}
      />
    );

    const toggleButton = screen.getByRole('button', { name: 'Mostrar saldo' });

    expect(screen.getByText('R$ ******')).toBeInTheDocument();
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(toggleButton);
    expect(onToggleBalanceVisibility).toHaveBeenCalledTimes(1);
  });

  it('mostra loading quando balanceLoading e true', () => {
    render(
      <AccountSummaryCard
        name="Joana"
        dateLabel="Quinta-feira, 08/09/2024"
        balanceLabel="Saldo"
        accountLabel="Conta corrente"
        balanceInCents={0}
        isBalanceVisible={true}
        balanceLoading={true}
        onToggleBalanceVisibility={() => {}}
      />
    );

    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.queryByText('R$ 0,00')).not.toBeInTheDocument();
  });
});
