import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthSession } from '@/app/lib/auth-session';
import { withAuth } from './with-auth';
import { TransactionType } from './interfaces/transaction.interfaces';

const { replaceMock, routerMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  routerMock: {
    replace: vi.fn(),
  },
}));

routerMock.replace = replaceMock;

vi.mock('next/navigation', () => ({
  useRouter: () => routerMock,
}));

type DummyPanelProps = {
  title: string;
  session: AuthSession;
};

function DummyPanel({ title, session }: DummyPanelProps) {
  return (
    <section>
      {title} - {session.user.name}
    </section>
  );
}

const GuardedDummyPanel = withAuth(DummyPanel);

const authenticatedSession: AuthSession = {
  token: 'mock-token-user-1',
  user: {
    id: 969,
    name: 'Joana da Silva Oliveira',
    email: 'joana@mail.com',
    account: {
      balance: 2500,
      transactions: [
        {
          id: 123,
          type: TransactionType.DEPOSIT,
          date: '2026-06-14T19:48:00Z',
          value: 50,
        },
      ],
    },
  },
};

describe('withAuth', () => {
  beforeEach(() => {
    replaceMock.mockClear();
  });

  it('nao renderiza componente enquanto estado esta loading', () => {
    render(<GuardedDummyPanel title="Painel" authStatus="loading" session={null} />);

    expect(screen.queryByText(/Painel/i)).not.toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it('redireciona para login quando usuario nao autenticado', async () => {
    render(<GuardedDummyPanel title="Painel" authStatus="unauthenticated" session={null} />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/home/login');
    });
  });

  it('renderiza componente quando usuario autenticado', () => {
    render(
      <GuardedDummyPanel title="Painel" authStatus="authenticated" session={authenticatedSession} />
    );

    expect(screen.getByText('Painel - Joana da Silva Oliveira')).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
