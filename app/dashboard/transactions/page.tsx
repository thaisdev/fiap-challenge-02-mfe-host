'use client';

import { useEffect, useState } from 'react';
import { useAuthSessionContext } from '@/app/context/auth-session-context';
import { StatementPanel } from '../_components/statement-panel';
import { useAccountActions, useTransactionsPage } from '../_store/account/account.hooks';
import { TransactionsFilter } from './_components/transactions-filter';
import type { TransactionFilters } from '../_services/transaction-service';

const TRANSACTIONS_PAGE_LIMIT = 10;

export default function TransactionsPage() {
  const { session } = useAuthSessionContext();
  const { data, pagination, request, filters } = useTransactionsPage();
  const { reloadTransactionsPage } = useAccountActions();
  const [filterFormKey, setFilterFormKey] = useState(0);

  useEffect(() => {
    if (!session) return;
    void reloadTransactionsPage({ page: 1, limit: TRANSACTIONS_PAGE_LIMIT });
  }, [reloadTransactionsPage, session]);

  if (!session) {
    return null;
  }

  const handleFilter = (nextFilters: TransactionFilters) => {
    void reloadTransactionsPage({ page: 1, limit: TRANSACTIONS_PAGE_LIMIT, ...nextFilters });
  };

  const handleAfterMutation = () => {
    setFilterFormKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      <TransactionsFilter
        key={filterFormKey}
        onFilter={handleFilter}
        isLoading={request.status === 'loading'}
      />
      <StatementPanel
        title="Transações"
        ariaLabel="Painel de transações"
        entries={data}
        pagination={pagination}
        isLoading={request.status === 'loading'}
        errorMessage={request.errorMessage}
        onPageChange={(page) =>
          reloadTransactionsPage({ page, limit: pagination.limit, ...filters })
        }
        onAfterMutation={handleAfterMutation}
      />
    </div>
  );
}
