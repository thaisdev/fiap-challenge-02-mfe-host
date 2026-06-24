'use client';

import { useEffect } from 'react';
import { useAuthSessionContext } from '@/app/context/auth-session-context';
import { StatementPanel } from '../_components/statement-panel';
import { useAccountActions, useTransactionsPage } from '../_store/account/account.hooks';

const TRANSACTIONS_PAGE_LIMIT = 10;

export default function TransactionsPage() {
  const { session } = useAuthSessionContext();
  const { data, pagination, request } = useTransactionsPage();
  const { reloadTransactionsPage } = useAccountActions();

  useEffect(() => {
    if (!session) {
      return;
    }

    void reloadTransactionsPage({ page: 1, limit: TRANSACTIONS_PAGE_LIMIT });
  }, [reloadTransactionsPage, session]);

  if (!session) {
    return null;
  }

  return (
    <StatementPanel
      title="Transações"
      ariaLabel="Painel de transações"
      entries={data}
      pagination={pagination}
      isLoading={request.status === 'loading'}
      errorMessage={request.errorMessage}
      onPageChange={(page) => reloadTransactionsPage({ page, limit: pagination.limit })}
    />
  );
}
