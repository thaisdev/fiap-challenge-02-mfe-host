import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TransactionsPage from './page';

const { useAuthSessionContextMock, statementPanelMock } = vi.hoisted(() => ({
  useAuthSessionContextMock: vi.fn(),
  statementPanelMock: vi.fn(),
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

describe('TransactionsPage', () => {
  beforeEach(() => {
    useAuthSessionContextMock.mockReset();
    statementPanelMock.mockReset();
  });

  it('nao renderiza conteudo quando nao existe sessao', () => {
    useAuthSessionContextMock.mockReturnValue({
      session: null,
    });

    const { container } = render(<TransactionsPage />);

    expect(container).toBeEmptyDOMElement();
    expect(statementPanelMock).not.toHaveBeenCalled();
  });

  it('renderiza o painel de transacoes com o titulo e aria-label esperados', () => {
    useAuthSessionContextMock.mockReturnValue({
      session: {
        user: {
          id: 969,
        },
      },
    });

    render(<TransactionsPage />);

    expect(screen.getByText('Mock StatementPanel')).toBeInTheDocument();
    expect(statementPanelMock).toHaveBeenCalledWith({
      title: 'Transações',
      ariaLabel: 'Painel de transações',
    });
  });
});
