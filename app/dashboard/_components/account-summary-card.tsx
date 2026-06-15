import Image from 'next/image';
import { formatCurrencyFromCents } from '@/app/lib/calc';

type AccountSummaryCardProps = {
  name: string;
  dateLabel: string;
  balanceLabel: string;
  accountLabel: string;
  balanceInCents: number;
  isBalanceVisible: boolean;
  balanceLoading?: boolean;
  onToggleBalanceVisibility: () => void;
};

export function AccountSummaryCard({
  name,
  dateLabel,
  balanceLabel,
  accountLabel,
  balanceInCents,
  isBalanceVisible,
  balanceLoading = false,
  onToggleBalanceVisibility,
}: AccountSummaryCardProps) {
  const displayedBalance = balanceLoading
    ? '...'
    : isBalanceVisible
      ? formatCurrencyFromCents(balanceInCents)
      : 'R$ ******';

  return (
    <section
      className="relative min-h-[560px] overflow-hidden rounded-md bg-primary px-9 py-8 text-surface mobile:min-h-[520px] mobile:px-5 mobile:py-7 desktop:min-h-[350px] desktop:px-6 desktop:py-7"
      aria-label="Resumo da conta"
    >
      <Image
        src="/dashboard/responsive/squares-top.svg"
        alt=""
        width={180}
        height={177}
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 desktop:hidden"
      />
      <Image
        src="/dashboard/banker.svg"
        alt=""
        width={172}
        height={228}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-8 z-0 mobile:left-4 desktop:hidden"
      />

      <div className="relative z-10 grid grid-cols-[minmax(0,1fr)_minmax(0,270px)] items-start gap-6 mobile:grid-cols-1 desktop:grid-cols-[1fr_340px]">
        <div className="space-y-2">
          <h1 className="text-title-xl font-bold text-surface">Olá, {name}! :)</h1>
          <p className="text-body-sm text-menu-hover">{dateLabel}</p>
        </div>

        <div className="w-full pt-6 mobile:pt-0 desktop:pt-6">
          <p className="flex items-center gap-2 text-title-lg font-semibold text-surface">
            {balanceLabel}
            <button
              type="button"
              onClick={onToggleBalanceVisibility}
              aria-label={isBalanceVisible ? 'Ocultar saldo' : 'Mostrar saldo'}
              aria-pressed={!isBalanceVisible}
              className="inline-flex h-5 w-6 cursor-pointer items-center justify-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface"
            >
              <Image
                src="/dashboard/show-balance.svg"
                alt=""
                width={19}
                height={13}
                aria-hidden="true"
              />
            </button>
          </p>
          <span className="mt-2 block h-[2px] w-full bg-accent" />
          <p className="mt-2 text-body-md text-menu-hover">{accountLabel}</p>
          <p className="mt-1 min-w-0 whitespace-nowrap text-[clamp(2.4rem,5vw,3rem)] leading-none text-surface mobile:text-[2.6rem] desktop:text-[3.2rem]">
            {displayedBalance}
          </p>
        </div>
      </div>
    </section>
  );
}
