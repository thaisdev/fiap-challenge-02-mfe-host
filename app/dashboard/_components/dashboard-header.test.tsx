import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DashboardHeader } from "./dashboard-header";

describe("DashboardHeader", () => {
  it("renderiza nome do usuario e botao do menu, com o menu fechado por padrao", () => {
    render(<DashboardHeader userName="Joana Fonseca Gomes" onLogout={vi.fn()} />);

    expect(screen.getByText("Joana Fonseca Gomes")).toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Menu do usuario" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("abre e fecha o menu ao clicar no gatilho", () => {
    render(<DashboardHeader userName="Joana Fonseca Gomes" onLogout={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: "Menu do usuario" });
    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Sair" })).toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("fecha o menu ao clicar fora dele", () => {
    render(
      <div>
        <DashboardHeader userName="Joana Fonseca Gomes" onLogout={vi.fn()} />
        <button type="button">Fora do menu</button>
      </div>
    );

    fireEvent.click(screen.getByRole("button", { name: "Menu do usuario" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "Fora do menu" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("fecha o menu ao pressionar Escape", () => {
    render(<DashboardHeader userName="Joana Fonseca Gomes" onLogout={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu do usuario" }));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("mantem o menu aberto ao clicar dentro dele", () => {
    render(<DashboardHeader userName="Joana Fonseca Gomes" onLogout={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu do usuario" }));
    fireEvent.mouseDown(screen.getByRole("menu"));

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("aciona callback de logout e fecha o menu ao clicar em Sair", () => {
    const onLogout = vi.fn();
    render(<DashboardHeader userName="Joana Fonseca Gomes" onLogout={onLogout} />);

    fireEvent.click(screen.getByRole("button", { name: "Menu do usuario" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Sair" }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
