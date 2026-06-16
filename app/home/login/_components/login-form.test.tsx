import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './login-form';
import { AUTH_SESSION_STORAGE_KEY } from '@/app/lib/auth-session';

const { loginMockAccountMock, pushMock } = vi.hoisted(() => ({
  loginMockAccountMock: vi.fn(),
  pushMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock('../../_services/auth-service', () => ({
  loginMockAccount: loginMockAccountMock,
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  const fillValidForm = () => {
    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'user@mail.com' } });
    fireEvent.input(screen.getByLabelText('Senha'), { target: { value: '123456' } });
  };

  it('renderiza campos principais e botao de acesso', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'Login', level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Senha')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /esqueci a senha/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /acessar/i })).toBeInTheDocument();
  });

  it('mantem o campo de senha com largura total no modal', () => {
    render(<LoginForm layout="modal" />);

    const senha = screen.getByLabelText('Senha');
    expect(senha.className).toContain('w-full');
    expect(senha.className).not.toContain('max-w-[165px]');
  });

  it('aplica constraints de validacao nos campos', () => {
    render(<LoginForm layout="modal" />);

    const email = screen.getByLabelText('Email');
    const senha = screen.getByLabelText('Senha');

    expect(email).toHaveAttribute('required');
    expect(senha).toHaveAttribute('required');
    expect(senha).toHaveAttribute('minLength', '6');
  });

  it('habilita o botao apenas quando form estiver valido', () => {
    render(<LoginForm layout="modal" />);

    const submitButton = screen.getByRole('button', { name: /acessar/i });
    expect(submitButton).toBeDisabled();

    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'user@mail.com' } });
    fireEvent.input(screen.getByLabelText('Senha'), { target: { value: '123456' } });

    expect(submitButton).toBeEnabled();

    fireEvent.input(screen.getByLabelText('Email'), { target: { value: 'email-invalido' } });
    expect(submitButton).toBeDisabled();
  });

  it('envia login, salva sessao e redireciona quando sucesso', async () => {
    loginMockAccountMock.mockResolvedValue({
      ok: true,
      message: 'Login realizado com sucesso.',
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
            type: 'Deposito',
            amount: 50,
            date: '21/11/2022',
          },
        ],
      },
    });

    render(<LoginForm layout="modal" />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /acessar/i }));

    await waitFor(() => {
      expect(loginMockAccountMock).toHaveBeenCalledWith({
        email: 'user@mail.com',
        password: '123456',
      });
    });

    expect(pushMock).toHaveBeenCalledWith('/dashboard/home');

    const stored = sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    expect(stored).not.toBeNull();
    expect(stored ? JSON.parse(stored) : null).toEqual({
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
            type: 'Deposito',
            amount: 50,
            date: '21/11/2022',
          },
        ],
      },
    });
    expect(sessionStorage.getItem('mcintosh-bank:auth-token')).toBe('mock-token-user-1');
  });

  it('usa fallback vazio quando FormData retorna null', async () => {
    loginMockAccountMock.mockResolvedValue({
      ok: false,
      message: 'Dados obrigatórios ausentes.',
    });

    render(<LoginForm layout="modal" />);
    const formDataGetSpy = vi.spyOn(FormData.prototype, 'get').mockReturnValue(null);

    const form = screen
      .getByRole('button', { name: /acessar/i })
      .closest('form') as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(loginMockAccountMock).toHaveBeenCalledWith({
        email: '',
        password: '',
      });
    });

    formDataGetSpy.mockRestore();
  });

  it('mostra feedback de erro quando API retorna falha', async () => {
    loginMockAccountMock.mockResolvedValue({
      ok: false,
      message: 'Email ou senha invalidos.',
    });

    render(<LoginForm layout="modal" />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /acessar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha invalidos.');
    expect(pushMock).not.toHaveBeenCalled();
  });

  it('fecha alerta manualmente no botao x', async () => {
    loginMockAccountMock.mockResolvedValue({
      ok: false,
      message: 'Falha ao autenticar',
    });

    render(<LoginForm layout="modal" />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: /acessar/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao autenticar');

    fireEvent.click(screen.getByRole('button', { name: /fechar alerta/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
