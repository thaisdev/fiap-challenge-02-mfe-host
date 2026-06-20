'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthSessionProvider, useAuthSessionContext } from '@/app/context/auth-session-context';
import { clearAuthSession } from '@/app/lib/auth-session';
import { AccountProvider, useAccountContext } from './_state/account-context';
import { AccountSummaryCard } from './_components/account-summary-card';
import { DashboardHeader } from './_components/dashboard-header';
import { Alert } from '@/components/ui/alert';
import { getTimestampFromTransactionDate } from './_utils/transaction-date';
import {
  DashboardSidebarItem,
  DashboardSidebarNav,
  type DashboardTabKey,
} from './_components/dashboard-sidebar-nav';
import { StatementPanel } from './_components/statement-panel';
import { ReactNode } from 'react';

const sidebarItems: readonly DashboardSidebarItem[] = [
  { key: 'home', label: 'Início', link: '/dashboard' },
  { key: 'transactions', label: 'Transações', link: '/dashboard/transactions' },
  { key: 'investments', label: 'Investimentos', link: '/dashboard/investments', disabled: true },
  {
    key: 'other-services',
    label: 'Outros serviços',
    link: '/dashboard/other-services',
    disabled: false,
  },
];

function getUserFirstName(fullName: string) {
  const [firstName] = fullName.trim().split(/\s+/);
  return firstName || fullName;
}

function formatCurrentDateLabel() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(now);
  const date = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(now);

  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date}`;
}

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { session } = useAuthSessionContext();
  const { balance, transactions, errorMessage } = useAccountContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTabKey>('home');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isErrorVisible, setIsErrorVisible] = useState(true);
  const currentDateLabel = useMemo(() => formatCurrentDateLabel(), []);

  const handleLogout = () => {
    clearAuthSession();
    router.push('/home/login');
  };

  const orderedTransactions = useMemo(() => {
    return [...transactions].sort((transactionA, transactionB) => {
      const timestampA = getTimestampFromTransactionDate(transactionA.date);
      const timestampB = getTimestampFromTransactionDate(transactionB.date);

      if (timestampA === null && timestampB === null) {
        return 0;
      }

      if (timestampA === null) {
        return 1;
      }

      if (timestampB === null) {
        return -1;
      }

      return timestampB - timestampA;
    });
  }, [transactions]);

  const visibleTransactions = useMemo(() => {
    return orderedTransactions.slice(0, 6);
  }, [orderedTransactions]);

  if (!session) {
    return null;
  }

  const { name } = session.user;
  const userFirstName = getUserFirstName(name);

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <DashboardHeader userName={name} onLogout={handleLogout} />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-[688px] px-4 pb-10 pt-8 md:pb-10 md:pt-10 desktop:max-w-[1140px] desktop:px-0 desktop:pb-8 desktop:pt-4">
          {errorMessage && isErrorVisible ? (
            <div className="pb-6">
              <Alert
                variant="error"
                message={errorMessage}
                onClose={() => setIsErrorVisible(false)}
              />
            </div>
          ) : null}

          <div className="grid gap-6 desktop:grid-cols-[142px_minmax(0,1fr)_240px] desktop:items-stretch desktop:gap-4">
            <div className="desktop:flex desktop:h-full">
              <DashboardSidebarNav
                items={sidebarItems}
                activeItem={activeTab}
                onChange={setActiveTab}
              />
            </div>

            <div className="min-w-0 space-y-6 desktop:col-start-2 desktop:space-y-3">
              <AccountSummaryCard
                name={userFirstName}
                dateLabel={currentDateLabel}
                balanceLabel="Saldo"
                accountLabel="Conta corrente"
                balance={balance}
                isBalanceVisible={isBalanceVisible}
                onToggleBalanceVisibility={() => setIsBalanceVisible((current) => !current)}
              />
              {children}
            </div>

            <div className="desktop:col-start-3 desktop:flex desktop:h-full">
              <StatementPanel title="Extrato" entries={visibleTransactions} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { session, status } = useAuthSessionContext();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/home/login');
    }
  }, [status, router]);

  if (status !== 'authenticated' || !session) {
    return null;
  }

  return (
    <AccountProvider session={session}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AccountProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthSessionProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthSessionProvider>
  );
}
