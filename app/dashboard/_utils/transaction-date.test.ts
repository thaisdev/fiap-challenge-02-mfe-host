import { describe, expect, it, vi } from "vitest";
import {
  dateOnlyFromTransactionDate,
  formatIsoDateToPtBr,
  formatTransactionDateLabel,
  formatTransactionMonthLabel,
  getDefaultTransactionDate,
  getTimestampFromTransactionDate,
  getTransactionDateRange,
  isTransactionDateWithinRange,
  toTransactionIsoDate,
} from "./transaction-date";

describe("transaction-date utils", () => {
  it("gera range com ano anterior como minDate e data atual como maxDate", () => {
    const range = getTransactionDateRange(new Date("2026-04-19T12:00:00.000Z"));

    expect(range.minDate).toBe("2025-01-01");
    expect(range.maxDate).toBe("2026-04-19");
  });

  it("retorna data padrao no formato ISO do input", () => {
    const value = getDefaultTransactionDate(new Date("2026-04-19T12:00:00.000Z"));

    expect(value).toBe("2026-04-19");
  });

  it("usa fallback de partes quando formatToParts nao traz ano, mes e dia", () => {
    const formatterMock = {
      format: () => "2026",
      formatToParts: () => [],
      resolvedOptions: () => ({ locale: "en-CA" }),
    } as unknown as Intl.DateTimeFormat;
    const dateTimeFormatSpy = vi
      .spyOn(Intl, "DateTimeFormat")
      .mockImplementation(() => formatterMock);

    try {
      const value = getDefaultTransactionDate(new Date("2026-04-19T12:00:00.000Z"));
      expect(value).toBe("1970-01-01");
    } finally {
      dateTimeFormatSpy.mockRestore();
    }
  });

  it("valida data apenas dentro do range permitido", () => {
    const range = { minDate: "2025-01-01", maxDate: "2026-12-31" };

    expect(isTransactionDateWithinRange("2026-04-19", range)).toBe(true);
    expect(isTransactionDateWithinRange("2024-12-31", range)).toBe(false);
    expect(isTransactionDateWithinRange("275760-04-19", range)).toBe(false);
  });

  it("converte data ISO de input para data-hora completa em UTC", () => {
    const range = { minDate: "2025-01-01", maxDate: "2026-12-31" };
    const isoDate = toTransactionIsoDate("2026-04-19", range);

    expect(isoDate).toBe("2026-04-19T12:00:00.000Z");
  });

  it("retorna null para data fora do range", () => {
    const range = { minDate: "2025-01-01", maxDate: "2026-12-31" };

    expect(toTransactionIsoDate("275760-04-19", range)).toBeNull();
  });

  it("retorna null para data invalida no calendario", () => {
    const range = { minDate: "2025-01-01", maxDate: "2026-12-31" };

    expect(toTransactionIsoDate("2026-02-31", range)).toBeNull();
  });

  it("formata data ISO para pt-BR", () => {
    expect(formatIsoDateToPtBr("2026-04-19")).toBe("19/04/2026");
  });

  it("mantem valor original quando data ISO e invalida", () => {
    expect(formatIsoDateToPtBr("2026-02-31")).toBe("2026-02-31");
  });

  it("extrai apenas a parte de data de uma transacao no fuso configurado", () => {
    expect(dateOnlyFromTransactionDate("2026-04-19T12:00:00.000Z")).toBe("2026-04-19");
    expect(dateOnlyFromTransactionDate("data-invalida")).toBeNull();
  });

  it("converte data de transacao para timestamp e retorna null quando invalida", () => {
    expect(getTimestampFromTransactionDate("2026-04-19T12:00:00.000Z")).toBe(
      new Date("2026-04-19T12:00:00.000Z").getTime()
    );
    expect(getTimestampFromTransactionDate("data-invalida")).toBeNull();
  });

  it("formata data de transacao para rotulo pt-BR e mantem valor quando invalida", () => {
    expect(formatTransactionDateLabel("2026-04-19T12:00:00.000Z")).toBe("19/04/2026");
    expect(formatTransactionDateLabel("data-invalida")).toBe("data-invalida");
  });

  it("formata mes de uma transacao com inicial maiuscula e retorna vazio quando invalida", () => {
    expect(formatTransactionMonthLabel("2026-04-19T12:00:00.000Z")).toBe("Abril");
    expect(formatTransactionMonthLabel("data-invalida")).toBe("");
  });
});
