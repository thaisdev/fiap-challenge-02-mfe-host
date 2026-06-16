import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardLayout from './layout';

const { replaceMock, useAuthSessionContextMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  useAuthSessionContextMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock('@/app/context/auth-session-context', () => ({
  AuthSessionProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAuthSessionContext: useAuthSessionContextMock,
}));

function authenticatedContext(name = 'Joana da Silva Oliveira') {
  return {
    session: {
      user: {
        name,
      },
    },
    status: 'authenticated',
    balance: 2500,
    statementEntries: [
      {
        id: '3',
        month: 'Abril',
        type: 'Deposito',
        amount: 50,
        date: 'data invalida',
      },
      {
        id: '1',
        month: 'Abril',
        type: 'Deposito',
        amount: 2500,
        date: '21/04/2026',
      },
      {
        id: '2',
        month: 'Abril',
        type: 'Transferencia',
        amount: -100,
        date: '20/04/2026',
      },
      {
        id: '4',
        month: 'Abril',
        type: 'Deposito',
        amount: 50,
        date: 'outra data invalida',
      },
    ],
  };
}

describe('DashboardLayout', () => {
  beforeEach(() => {
    replaceMock.mockClear();
    useAuthSessionContextMock.mockReturnValue(authenticatedContext());
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

  it('redireciona para login quando sessao esta unauthenticated', () => {
    useAuthSessionContextMock.mockReturnValue({
      ...authenticatedContext(),
      session: null,
      status: 'unauthenticated',
      statementEntries: [],
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
      ...authenticatedContext(),
      session: null,
      status: 'loading',
      statementEntries: [],
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
    useAuthSessionContextMock.mockReturnValue(authenticatedContext(''));

    render(
      <DashboardLayout>
        <main>Conteudo da area de dashboard</main>
      </DashboardLayout>
    );

    expect(screen.getByText(/Olá, !/i)).toBeInTheDocument();
  });
});
