import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardSidebarNav } from './dashboard-sidebar-nav';

const { redirectMock, usePathnameMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  usePathnameMock: vi.fn(() => '/dashboard'),
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
  usePathname: usePathnameMock,
}));

const items = [
  { key: 'home', label: 'Início', link: '/dashboard/home' },
  { key: 'my-cards', label: 'Meus cartões', link: '/dashboard/my-cards' },
  { key: 'transactions', label: 'Transações', link: '/dashboard/transactions', disabled: true },
  { key: 'investments', label: 'Investimentos', link: '/dashboard/investments', disabled: true },
  {
    key: 'other-services',
    label: 'Outros serviços',
    link: '/dashboard/other-services',
    disabled: true,
  },
] as const;

function triggerButtonClickHandler(element: HTMLElement) {
  const reactPropsKey = Object.keys(element).find((key) => key.startsWith('__reactProps$'));
  if (!reactPropsKey) {
    throw new Error('Props internas do React nao encontradas');
  }

  const reactProps = (element as unknown as Record<string, unknown>)[reactPropsKey] as {
    onClick?: () => void;
  };
  reactProps.onClick?.();
}

function getOpenButtons() {
  return screen.queryAllByRole('button', { name: /fechar menu de servi[cç]os/i });
}

function getMobileMenuPanel() {
  const closeButtons = getOpenButtons();
  const panelCloseButton = closeButtons[1];
  expect(panelCloseButton).toBeDefined();
  const panel = panelCloseButton.closest('div');
  expect(panel).not.toBeNull();
  return { panel: panel as HTMLDivElement, panelCloseButton };
}

describe('DashboardSidebarNav', () => {
  it('destaca item ativo pela rota atual e respeita itens desabilitados', () => {
    usePathnameMock.mockReturnValue('/dashboard/home');
    redirectMock.mockClear();
    render(<DashboardSidebarNav items={items} />);

    const activeButton = screen.getByRole('button', { name: /in[ií]cio/i });
    const enabledButton = screen.getByRole('button', { name: /meus cart[oõ]es/i });
    const disabledButton = screen.getByRole('button', { name: /transa[cç][oõ]es/i });

    expect(activeButton).toHaveClass('text-secondary');
    expect(enabledButton).toHaveClass('text-heading');
    expect(disabledButton).toBeDisabled();

    fireEvent.click(activeButton);
    fireEvent.click(enabledButton);
    fireEvent.click(disabledButton);

    expect(redirectMock).toHaveBeenNthCalledWith(1, '/dashboard/home');
    expect(redirectMock).toHaveBeenNthCalledWith(2, '/dashboard/my-cards');
    expect(redirectMock).toHaveBeenCalledTimes(2);
  });

  it('marca item ativo corretamente para sub-rotas', () => {
    usePathnameMock.mockReturnValue('/dashboard/my-cards');
    render(<DashboardSidebarNav items={items} />);

    const activeButton = screen.getByRole('button', { name: /meus cart[oõ]es/i });
    const homeButton = screen.getByRole('button', { name: /in[ií]cio/i });

    expect(activeButton).toHaveClass('text-secondary');
    expect(homeButton).not.toHaveClass('text-secondary');
  });

  it('abre e fecha o menu mobile pelo botao de toggle', () => {
    usePathnameMock.mockReturnValue('/dashboard');
    render(<DashboardSidebarNav items={items} />);

    expect(getOpenButtons()).toHaveLength(0);

    const toggleButton = screen.getByRole('button', { name: /abrir menu de servi[cç]os/i });
    fireEvent.click(toggleButton);

    expect(getOpenButtons()).toHaveLength(2);
    expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    expect(toggleButton).toHaveAttribute('aria-label', expect.stringMatching(/fechar menu/i));

    fireEvent.click(toggleButton);
    expect(getOpenButtons()).toHaveLength(0);
  });

  it('fecha o menu mobile ao selecionar item habilitado', () => {
    usePathnameMock.mockReturnValue('/dashboard');
    redirectMock.mockClear();
    render(<DashboardSidebarNav items={items} />);

    fireEvent.click(screen.getByRole('button', { name: /abrir menu de servi[cç]os/i }));

    const { panel } = getMobileMenuPanel();
    fireEvent.click(within(panel).getByRole('button', { name: /meus cart[oõ]es/i }));

    expect(getOpenButtons()).toHaveLength(0);
    expect(redirectMock).toHaveBeenCalledWith('/dashboard/my-cards');
  });

  it('mantem menu mobile aberto quando clica em item desabilitado', () => {
    usePathnameMock.mockReturnValue('/dashboard');
    redirectMock.mockClear();
    render(<DashboardSidebarNav items={items} />);

    fireEvent.click(screen.getByRole('button', { name: /abrir menu de servi[cç]os/i }));

    const { panel } = getMobileMenuPanel();
    const disabledButton = within(panel).getByRole('button', { name: /transa[cç][oõ]es/i });
    expect(disabledButton).toBeDisabled();

    fireEvent.click(disabledButton);

    expect(redirectMock).not.toHaveBeenCalled();
    expect(getOpenButtons()).toHaveLength(2);
  });

  it('ignora item desabilitado mesmo quando handler onClick e disparado manualmente', () => {
    usePathnameMock.mockReturnValue('/dashboard');
    redirectMock.mockClear();
    render(<DashboardSidebarNav items={items} />);

    const disabledDesktopButton = screen.getByRole('button', { name: /transa[cç][oõ]es/i });
    triggerButtonClickHandler(disabledDesktopButton);

    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('fecha o menu mobile pelo botao interno do painel', () => {
    usePathnameMock.mockReturnValue('/dashboard');
    render(<DashboardSidebarNav items={items} />);

    fireEvent.click(screen.getByRole('button', { name: /abrir menu de servi[cç]os/i }));

    const { panelCloseButton } = getMobileMenuPanel();
    fireEvent.click(panelCloseButton);

    expect(getOpenButtons()).toHaveLength(0);
  });
});
