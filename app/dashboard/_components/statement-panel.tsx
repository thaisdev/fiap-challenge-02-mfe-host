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
import { deleteReceiptFile } from '../_services/blob-service';

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

    const receiptUrl =
      visibleTransactions.find((t) => t.id === activeSelectedTransactionId)?.receiptFile?.url ??
      null;

    onDeleteTransaction(activeSelectedTransactionId).then((result) => {
      if (!result.ok) {
        setDeleteFeedback(result.message);
        return;
      }

      if (receiptUrl) {
        deleteReceiptFile(receiptUrl);
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
              {transaction.receiptFile ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="min-w-0 flex-1 truncate text-body-xs text-subtle"
                    title={transaction.receiptFile.filename}
                  >
                    {transaction.receiptFile.filename}
                  </span>
                  <a
                    href={transaction.receiptFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Abrir comprovante ${transaction.receiptFile.filename} em nova aba`}
                    className="inline-flex h-6 w-6 flex-none cursor-pointer items-center justify-center rounded-sm text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                      <path
                        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </a>
                </div>
              ) : null}
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
