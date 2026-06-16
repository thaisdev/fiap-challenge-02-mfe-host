import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthSession } from '@/app/lib/auth-session';
import { withAuth } from './with-auth';
import { StatementEntryType } from './interfaces/transaction.interfaces';

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
    id: 'user-1',
    name: 'Joana da Silva Oliveira',
    email: 'joana@mail.com',
    createdAt: '2026-01-01T00:00:00.000Z',
    accountBalance: 2500,
    statementEntries: [
      {
        id: 'entry-1',
        month: 'Novembro',
        type: StatementEntryType.DEPOSIT,
        amount: 50,
        date: '21/11/2022',
      },
    ],
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
