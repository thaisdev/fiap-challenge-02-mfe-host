import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomeDashboardPage from './page';

const { useAuthSessionContextMock } = vi.hoisted(() => ({
  useAuthSessionContextMock: vi.fn(),
}));

vi.mock('@/app/context/auth-session-context', () => ({
  useAuthSessionContext: useAuthSessionContextMock,
}));

vi.mock('./_components/financial-visibility-panel', () => ({
  FinancialVisibilityPanel: () => <section>Mock FinancialVisibilityPanel</section>,
}));

describe('HomeDashboardPage', () => {
  beforeEach(() => {
    useAuthSessionContextMock.mockReset();
  });

  it('nao renderiza conteudo quando nao existe sessao', () => {
    useAuthSessionContextMock.mockReturnValue({
      session: null,
    });

    const { container } = render(<HomeDashboardPage />);

    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza os paineis da home quando existe sessao', () => {
    useAuthSessionContextMock.mockReturnValue({
      session: {
        user: {
          id: 'user-1',
        },
      },
    });

    render(<HomeDashboardPage />);

    expect(screen.getByText('Mock FinancialVisibilityPanel')).toBeInTheDocument();
  });
});
