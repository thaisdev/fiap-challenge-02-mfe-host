'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EditStatementEntryModal } from './edit-statement-entry-modal';
import {
  formatTransactionTypeLabel,
  Transaction,
} from './interfaces/statement-panel.interfaces';
import { formatCurrency } from '@/app/lib/calc';
import {
  formatTransactionDateLabel,
  formatTransactionMonthLabel,
} from '../_utils/transaction-date';
import { useAccount, useAccountActions } from '../_store/account/account.hooks';

type StatementPanelProps = {
  title?: string;
  ariaLabel?: string;
  editableYear?: number | null;
  showActions?: boolean;
  entries?: Transaction[];
};

export function StatementPanel({
  title = 'Extrato',
  ariaLabel = 'Extrato da conta',
  showActions = true,
  entries = [],
}: StatementPanelProps) {
  const { transactions } = useAccount();
  const { onDeleteTransaction, onEditTransaction } = useAccountActions();

  const visibleTransactions = entries.length > 0 ? entries : transactions;

  const panelRef = useRef<HTMLElement | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);

  const selectedTransaction =
    visibleTransactions.find((transaction) => transaction.id === selectedTransactionId) ?? null;
  const activeSelectedTransactionId = selectedTransaction?.id ?? null;
  const areTransactionActionsEnabled = activeSelectedTransactionId !== null;

  useEffect(() => {
    const handleOutsidePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (panelRef.current?.contains(target)) {
        return;
      }

      setSelectedTransactionId(null);
    };

    document.addEventListener('mousedown', handleOutsidePointerDown);
    document.addEventListener('touchstart', handleOutsidePointerDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointerDown);
      document.removeEventListener('touchstart', handleOutsidePointerDown);
    };
  }, []);

  const handleDeleteSelectedTransaction = () => {
    if (!activeSelectedTransactionId) {
      return;
    }

    setDeleteFeedback(null);
    setEditingTransactionId(null);

    onDeleteTransaction(activeSelectedTransactionId).then((result) => {
      if (!result.ok) {
        setDeleteFeedback(result.message);
      }
    });
  };

  const handleEditSelectedTransaction = () => {
    if (!activeSelectedTransactionId) {
      return;
    }

    setEditingTransactionId(activeSelectedTransactionId);
  };

  const editingTransaction =
    visibleTransactions.find((transaction) => transaction.id === editingTransactionId) ?? null;

  return (
    <>
      <aside ref={panelRef} className="rounded-md bg-surface px-5 py-5" aria-label={ariaLabel}>
        <div className="flex items-center justify-between gap-3 pr-1">
          <h2 className="text-title-xl font-bold text-black">{title}</h2>
          {showActions ? (
            <div className="flex items-center gap-3">
              <Button
                aria-label="Editar extrato"
                variant="solid"
                tone="primary"
                className="h-12 w-12 !rounded-full p-0"
                disabled={!areTransactionActionsEnabled}
                onClick={handleEditSelectedTransaction}
              >
                <Image
                  src="/icons/pencil-edit.svg"
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
              </Button>
              <Button
                aria-label="Excluir extrato"
                variant="solid"
                tone="primary"
                className="h-12 w-12 !rounded-full p-0"
                disabled={!areTransactionActionsEnabled}
                onClick={handleDeleteSelectedTransaction}
              >
                <Image
                  src="/icons/trash-exclude.svg"
                  alt=""
                  width={24}
                  height={24}
                  aria-hidden="true"
                />
              </Button>
            </div>
          ) : null}
        </div>

        {deleteFeedback ? (
          <div className="mt-3">
            <Alert variant="error" message={deleteFeedback} onClose={() => setDeleteFeedback(null)} />
          </div>
        ) : null}

        <ul className="mt-3 space-y-3">
          {visibleTransactions.map((transaction) => (
            <li
              key={transaction.id}
              onClick={() => setSelectedTransactionId(transaction.id)}
              className={[
                'cursor-pointer border-b border-secondary/35 pb-2 transition-colors',
                activeSelectedTransactionId === transaction.id ? 'bg-surface-soft' : '',
              ].join(' ')}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-body-sm font-semibold text-secondary">
                  {formatTransactionMonthLabel(transaction.date)}
                </span>
                <span className="text-body-sm text-subtle">
                  {formatTransactionDateLabel(transaction.date)}
                </span>
              </div>
              <p className="text-body-md text-heading">
                {formatTransactionTypeLabel(transaction.type)}
              </p>
              <p className="text-title-lg font-semibold text-black">
                {formatCurrency(transaction.value)}
              </p>
            </li>
          ))}
        </ul>
      </aside>

      {editingTransaction ? (
        <EditStatementEntryModal
          entry={editingTransaction}
          onClose={() => setEditingTransactionId(null)}
          onSubmit={onEditTransaction}
        />
      ) : null}
    </>
  );
}
