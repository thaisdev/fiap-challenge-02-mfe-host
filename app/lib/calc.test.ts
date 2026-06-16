import { describe, expect, it } from "vitest";
import { formatCurrency, sum } from "./calc";

describe("calc functions", () => {
  it("adds two numbers correctly", () => {
    expect(sum(2, 3)).toBe(5);
  });

  it("formats currency in pt-BR", () => {
    expect(formatCurrency(1234.5)).toContain("1.234,50");
  });
});
