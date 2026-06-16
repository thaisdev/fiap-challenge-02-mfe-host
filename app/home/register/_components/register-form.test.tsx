import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisterForm } from "./register-form";

const { registerAccountMock } = vi.hoisted(() => ({
  registerAccountMock: vi.fn(),
}));

vi.mock("../../_services/auth-service", () => ({
  registerAccount: registerAccountMock,
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const fillValidForm = () => {
    fireEvent.input(screen.getByLabelText("Nome"), { target: { value: "Maria Silva" } });
    fireEvent.input(screen.getByLabelText("Email"), { target: { value: "maria@mail.com" } });
    fireEvent.input(screen.getByLabelText("Senha"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("checkbox"));
  };

  it("renderiza campos e botao no layout padrao", () => {
    render(<RegisterForm />);

    expect(
      screen.getByRole("heading", {
        name: /preencha os campos abaixo para criar sua conta corrente/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nome")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /criar conta/i })).toBeInTheDocument();
  });

  it("aplica classe de senha especifica no layout modal", () => {
    render(<RegisterForm layout="modal" />);

    const senha = screen.getByLabelText("Senha");
    expect(senha.className).toContain("max-w-[165px]");
    expect(senha.className).toContain("mobile:max-w-none");
  });

  it("mostra erro para email invalido no blur", () => {
    render(<RegisterForm layout="modal" />);

    const email = screen.getByLabelText("Email");
    fireEvent.blur(email, { target: { value: "email-invalido" } });

    expect(screen.getByText("Dado incorreto. Revise e digite novamente.")).toBeInTheDocument();
  });

  it("remove erro quando o campo volta a ser valido no change", () => {
    render(<RegisterForm layout="modal" />);

    const email = screen.getByLabelText("Email");
    fireEvent.blur(email, { target: { value: "email-invalido" } });

    expect(screen.getByText("Dado incorreto. Revise e digite novamente.")).toBeInTheDocument();

    fireEvent.change(email, { target: { value: "valido@mail.com" } });

    expect(screen.queryByText("Dado incorreto. Revise e digite novamente.")).not.toBeInTheDocument();
  });

  it("nao mostra erro no change se o campo ainda nao estava em erro", () => {
    render(<RegisterForm layout="modal" />);

    const email = screen.getByLabelText("Email");
    fireEvent.change(email, { target: { value: "email-invalido" } });

    expect(screen.queryByText("Dado incorreto. Revise e digite novamente.")).not.toBeInTheDocument();
  });

  it("mantem botao desabilitado ate o form ficar valido", () => {
    render(<RegisterForm layout="modal" />);

    const submitButton = screen.getByRole("button", { name: /criar conta/i });
    expect(submitButton).toBeDisabled();

    fireEvent.input(screen.getByLabelText("Nome"), { target: { value: "Maria Silva" } });
    fireEvent.input(screen.getByLabelText("Email"), { target: { value: "maria@mail.com" } });
    fireEvent.input(screen.getByLabelText("Senha"), { target: { value: "123456" } });

    expect(submitButton).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(submitButton).toBeEnabled();

    fireEvent.input(screen.getByLabelText("Email"), { target: { value: "email-invalido" } });
    expect(submitButton).toBeDisabled();
  });

  it("envia register e mostra feedback de sucesso da API", async () => {
    registerAccountMock.mockResolvedValue({
      ok: true,
      message: "Usuario criado com sucesso.",
    });

    render(<RegisterForm layout="modal" />);
    fillValidForm();

    const submitButton = screen.getByRole("button", { name: /criar conta/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(registerAccountMock).toHaveBeenCalledWith({
        name: "Maria Silva",
        email: "maria@mail.com",
        password: "123456",
      });
    });

    expect(await screen.findByRole("status")).toHaveTextContent("Usuario criado com sucesso.");
  });

  it("nao envia cadastro quando a senha e invalida mesmo com submit direto no form", async () => {
    render(<RegisterForm layout="modal" />);

    fireEvent.input(screen.getByLabelText("Nome"), { target: { value: "Maria Silva" } });
    fireEvent.input(screen.getByLabelText("Email"), { target: { value: "maria@mail.com" } });
    fireEvent.input(screen.getByLabelText("Senha"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("checkbox"));

    const form = screen.getByRole("button", { name: /criar conta/i }).closest("form");
    if (!form) {
      throw new Error("Formulario nao encontrado");
    }

    fireEvent.submit(form);

    await waitFor(() => {
      expect(registerAccountMock).not.toHaveBeenCalled();
    });
  });

  it("nao envia cadastro quando email ou senha falham na validacao do submit", async () => {
    const { rerender } = render(<RegisterForm layout="modal" />);

    fireEvent.input(screen.getByLabelText("Nome"), { target: { value: "Maria Silva" } });
    fireEvent.input(screen.getByLabelText("Email"), { target: { value: "email-invalido" } });
    fireEvent.input(screen.getByLabelText("Senha"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("checkbox"));

    let form = screen.getByRole("button", { name: /criar conta/i }).closest("form");
    if (!form) {
      throw new Error("Formulario nao encontrado");
    }

    fireEvent.submit(form);
    expect(registerAccountMock).not.toHaveBeenCalled();

    rerender(<RegisterForm layout="modal" />);

    fireEvent.input(screen.getByLabelText("Nome"), { target: { value: "Maria Silva" } });
    fireEvent.input(screen.getByLabelText("Email"), { target: { value: "maria@mail.com" } });
    fireEvent.input(screen.getByLabelText("Senha"), { target: { value: "123" } });
    fireEvent.click(screen.getByRole("checkbox"));

    form = screen.getByRole("button", { name: /criar conta/i }).closest("form");
    if (!form) {
      throw new Error("Formulario nao encontrado");
    }

    fireEvent.submit(form);
    expect(registerAccountMock).not.toHaveBeenCalled();
  });

  it("nao envia cadastro quando FormData retorna null e o formulario fica invalido", async () => {
    render(<RegisterForm layout="modal" />);
    const formDataGetSpy = vi.spyOn(FormData.prototype, "get").mockReturnValue(null);

    const form = screen
      .getByRole("button", { name: /criar conta/i })
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(registerAccountMock).not.toHaveBeenCalled();
    });

    formDataGetSpy.mockRestore();
  });

  it("nao envia cadastro quando FormData retorna null para email ou senha", async () => {
    const { rerender } = render(<RegisterForm layout="modal" />);
    fireEvent.click(screen.getByRole("checkbox"));

    let formDataGetSpy = vi
      .spyOn(FormData.prototype, "get")
      .mockReturnValueOnce("Maria Silva")
      .mockReturnValueOnce(null);

    let form = screen.getByRole("button", { name: /criar conta/i }).closest("form");
    if (!form) {
      throw new Error("Formulario nao encontrado");
    }

    fireEvent.submit(form);
    expect(registerAccountMock).not.toHaveBeenCalled();
    formDataGetSpy.mockRestore();

    rerender(<RegisterForm layout="modal" />);
    fireEvent.click(screen.getByRole("checkbox"));

    formDataGetSpy = vi
      .spyOn(FormData.prototype, "get")
      .mockReturnValueOnce("Maria Silva")
      .mockReturnValueOnce("maria@mail.com")
      .mockReturnValueOnce(null);

    form = screen.getByRole("button", { name: /criar conta/i }).closest("form");
    if (!form) {
      throw new Error("Formulario nao encontrado");
    }

    fireEvent.submit(form);
    expect(registerAccountMock).not.toHaveBeenCalled();
    formDataGetSpy.mockRestore();
  });

  it("nao envia cadastro quando o campo de consentimento nao existe", async () => {
    render(<RegisterForm layout="modal" />);
    fillValidForm();

    screen.getByRole("checkbox").removeAttribute("name");

    const form = screen
      .getByRole("button", { name: /criar conta/i })
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(registerAccountMock).not.toHaveBeenCalled();
    });
  });

  it("envia strings vazias quando payload valido vira null no submit", async () => {
    registerAccountMock.mockResolvedValue({
      ok: true,
      message: "Usuario criado com sucesso.",
    });
    render(<RegisterForm layout="modal" />);
    fireEvent.click(screen.getByRole("checkbox"));

    const formDataGetSpy = vi
      .spyOn(FormData.prototype, "get")
      .mockReturnValueOnce("Maria Silva")
      .mockReturnValueOnce("maria@mail.com")
      .mockReturnValueOnce("123456")
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null)
      .mockReturnValueOnce(null);

    const form = screen
      .getByRole("button", { name: /criar conta/i })
      .closest("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(registerAccountMock).toHaveBeenCalledWith({
        name: "",
        email: "",
        password: "",
      });
    });

    formDataGetSpy.mockRestore();
  });

  it("mostra feedback de erro quando API retorna falha", async () => {
    registerAccountMock.mockResolvedValue({
      ok: false,
      message: "Ja existe usuario cadastrado com este email.",
    });

    render(<RegisterForm layout="modal" />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Ja existe usuario cadastrado com este email."
    );
  });

  it("fecha alerta manualmente no botao x", async () => {
    registerAccountMock.mockResolvedValue({
      ok: false,
      message: "Erro ao cadastrar",
    });

    render(<RegisterForm layout="modal" />);
    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: /criar conta/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Erro ao cadastrar");

    fireEvent.click(screen.getByRole("button", { name: /fechar alerta/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
