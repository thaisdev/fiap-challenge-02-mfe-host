import { FinancialVisibilityMfe } from './financial-visibility-mfe';

export function FinancialVisibilityPanel() {
  return (
    <section
      className="surface-panel min-w-0 max-w-full overflow-hidden p-5"
      aria-labelledby="financial-visibility-title"
    >
      <div className="grid gap-1">
        <h2 id="financial-visibility-title" className="text-title-lg font-bold">
          Visibilidade financeira
        </h2>
        <p className="text-body-sm text-subtle">
          Gráficos e análises para acompanhar seu desempenho financeiro.
        </p>
      </div>

      <div className="mt-4 min-w-0 max-w-full overflow-x-auto">
        <FinancialVisibilityMfe />
      </div>
    </section>
  );
}
