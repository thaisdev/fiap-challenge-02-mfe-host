import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TransactionsPage from './page';

const {
  reloadTransactionsPageMock,
  statementPanelMock,
  useAuthSessionContextMock,
  useTransactionsPageMock,
} = vi.hoisted(() => ({
  reloadTransactionsPageMock: vi.fn(),
  statementPanelMock: vi.fn(),
  useAuthSessionContextMock: vi.fn(),
  useTransactionsPageMock: vi.fn(),
}));

vi.mock('@/app/context/auth-session-context', () => ({
  useAuthSessionContext: useAuthSessionContextMock,
}));

vi.mock('../_components/statement-panel', () => ({
  StatementPanel: (props: { title?: string; ariaLabel?: string }) => {
    statementPanelMock(props);
    return <section>Mock StatementPanel</section>;
  },
}));

vi.mock('../_store/account/account.hooks', () => ({
  useAccountActions: () => ({
    reloadTransactionsPage: reloadTransactionsPageMock,
  }),
  useTransactionsPage: useTransactionsPageMock,
}));

describe('TransactionsPage', () => {
  beforeEach(() => {
    reloadTransactionsPageMock.mockReset();
    reloadTransactionsPageMock.mockResolvedValue(undefined);
    useAuthSessionContextMock.mockReset();
    statementPanelMock.mockReset();
    useTransactionsPageMock.mockReturnValue({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      request: {
        status: 'idle',
        errorMessage: null,
      },
    });
  });

  it('nao renderiza conteudo quando nao existe sessao', () => {
    useAuthSessionContextMock.mockReturnValue({
      session: null,
    });

    const { container } = render(<TransactionsPage />);

    expect(container).toBeEmptyDOMElement();
    expect(statementPanelMock).not.toHaveBeenCalled();
    expect(reloadTransactionsPageMock).not.toHaveBeenCalled();
  });

  it('renderiza o painel de transações e carrega a primeira página', async () => {
    useAuthSessionContextMock.mockReturnValue({
      session: {
        user: {
          id: 969,
        },
      },
    });

    render(<TransactionsPage />);

    expect(screen.getByText('Mock StatementPanel')).toBeInTheDocument();
    expect(statementPanelMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Transações',
        ariaLabel: 'Painel de transações',
      })
    );

    await waitFor(() => {
      expect(reloadTransactionsPageMock).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });
});
