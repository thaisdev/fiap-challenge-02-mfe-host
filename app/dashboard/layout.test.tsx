import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_SESSION_STORAGE_KEY } from '@/app/lib/auth-session';
import DashboardLayout from './layout';

const { replaceMock, pushMock, useAuthSessionContextMock, useAccountContextMock } = vi.hoisted(
  () => ({
    replaceMock: vi.fn(),
    pushMock: vi.fn(),
    useAuthSessionContextMock: vi.fn(),
    useAccountContextMock: vi.fn(),
  })
);

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
  }),
}));

vi.mock('@/app/context/auth-session-context', () => ({
  AuthSessionProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuthSessionContext: useAuthSessionContextMock,
}));

vi.mock('./_state/account-context', () => ({
  AccountProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAccountContext: useAccountContextMock,
}));

function authenticatedSession(name = 'Joana da Silva Oliveira') {
  return {
    session: {
      user: {
        name,
      },
    },
    status: 'authenticated',
  };
}

function accountContext() {
  return {
    status: 'ready',
    errorMessage: null,
    balance: 2500,
    transactions: [
      {
        id: 3,
        type: 'DEPOSIT',
        date: 'data invalida',
        value: 50,
      },
      {
        id: 1,
        type: 'DEPOSIT',
        date: '2026-04-21T12:00:00.000Z',
        value: 2500,
      },
      {
        id: 2,
        type: 'TRANSFER',
        date: '2026-04-20T12:00:00.000Z',
        value: 100,
      },
      {
        id: 4,
        type: 'DEPOSIT',
        date: 'outra data invalida',
        value: 50,
      },
    ],
  };
}

describe('DashboardLayout', () => {
  beforeEach(() => {
    replaceMock.mockClear();
    pushMock.mockClear();
    sessionStorage.clear();
    useAuthSessionContextMock.mockReturnValue(authenticatedSession());
    useAccountContextMock.mockReturnValue(accountContext());
  });

  it('renderiza container da area de dashboard com children', () => {
    render(
      <DashboardLayout>
        <main>Conteudo da area de dashboard</main>
      </DashboardLayout>
    );

    expect(screen.getByText('Conteudo da area de dashboard')).toBeInTheDocument();
    expect(screen.getByText(/joana da silva oliveira/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar saldo' }));
    expect(screen.getByRole('button', { name: 'Mostrar saldo' })).toBeInTheDocument();
  });

  it('limpa a sessao e redireciona para login ao clicar em Sair', () => {
    sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ token: 'token-123' }));

    render(
      <DashboardLayout>
        <main>Conteudo da area de dashboard</main>
      </DashboardLayout>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Menu do usuario' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sair' }));

    expect(sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY)).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/home/login');
  });

  it('exibe alerta de erro quando a busca da conta falha', () => {
    useAccountContextMock.mockReturnValue({
      ...accountContext(),
      status: 'error',
      errorMessage: 'Token inválido ou expirado',
    });

    render(
      <DashboardLayout>
        <main>Conteudo da area de dashboard</main>
      </DashboardLayout>
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Token inválido ou expirado');

    fireEvent.click(screen.getByRole('button', { name: 'Fechar alerta' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('redireciona para login quando sessao esta unauthenticated', () => {
    useAuthSessionContextMock.mockReturnValue({
      ...authenticatedSession(),
      session: null,
      status: 'unauthenticated',
    });

    const { container } = render(
      <DashboardLayout>
        <main>Conteudo protegido</main>
      </DashboardLayout>
    );

    expect(container).toBeEmptyDOMElement();
    expect(replaceMock).toHaveBeenCalledWith('/home/login');
  });

  it('nao renderiza children enquanto autenticacao esta carregando', () => {
    useAuthSessionContextMock.mockReturnValue({
      ...authenticatedSession(),
      session: null,
      status: 'loading',
    });

    const { container } = render(
      <DashboardLayout>
        <main>Conteudo protegido</main>
      </DashboardLayout>
    );

    expect(container).toBeEmptyDOMElement();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('usa nome completo como fallback quando primeiro nome esta vazio', () => {
    useAuthSessionContextMock.mockReturnValue(authenticatedSession(''));

    render(
      <DashboardLayout>
        <main>Conteudo da area de dashboard</main>
      </DashboardLayout>
    );

    expect(screen.getByText(/Olá, !/i)).toBeInTheDocument();
  });
});
