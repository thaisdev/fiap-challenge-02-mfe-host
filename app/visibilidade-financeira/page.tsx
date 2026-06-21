import { FinancialVisibilityMfe } from './_components/financial-visibility-mfe';

export default function VisibilidadeFinanceiraPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col gap-6 bg-background px-4 py-8 md:px-8 md:py-12">
      <header className="grid gap-2">
        <p className="text-body-sm font-semibold text-secondary">
          McIntosh Bank
        </p>
        <h1 className="text-title-xl font-bold">Visibilidade financeira</h1>
        <p className="max-w-3xl text-body-md text-subtle">
          Acompanhe a visão financeira consolidada carregada pelo
          microfrontend Angular.
        </p>
      </header>

      <section className="surface-panel p-4 md:p-6">
        <FinancialVisibilityMfe />
      </section>
    </main>
  );
}
