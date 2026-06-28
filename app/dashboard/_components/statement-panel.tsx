'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TransactionModal } from './transaction-modal';
import type { NewTransactionResult } from './interfaces/new-transaction-panel.interfaces';
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
import type { TransactionsPagination } from '../_services/transaction-service';

type StatementPanelProps = {
  title?: string;
  ariaLabel?: string;
  editableYear?: number | null;
  showActions?: boolean;
  showTransactionId?: boolean;
  entries?: Transaction[];
  pagination?: TransactionsPagination;
  isLoading?: boolean;
  errorMessage?: string | null;
  onPageChange?: (page: number) => void;
  viewAllHref?: string;
  onAfterMutation?: () => void;
};

export function StatementPanel({
  title = 'Extrato',
  ariaLabel = 'Extrato da conta',
  showActions = true,
  showTransactionId = false,
  entries,
  pagination,
  isLoading = false,
  errorMessage = null,
  onPageChange,
  viewAllHref,
  onAfterMutation,
}: StatementPanelProps) {
  const { transactions } = useAccount();
  const { userId, onDeleteTransaction, onEditTransaction, onSubmitTransaction } = useAccountActions();

  const visibleTransactions = entries ?? transactions;

  const panelRef = useRef<HTMLElement | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<number | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
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

      onAfterMutation?.();

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
  const hasPagination = Boolean(pagination && onPageChange);

  function withAfterMutation<TPayload>(requestFn: (payload: TPayload) => Promise<NewTransactionResult>) {
    return async (payload: TPayload): Promise<NewTransactionResult> => {
      const result = await requestFn(payload);
      if (result.ok) onAfterMutation?.();
      return result;
    };
  }

  return (
    <>
      <aside ref={panelRef} className="w-full rounded-md bg-surface px-5 py-5" aria-label={ariaLabel}>
        <div className="flex items-center justify-between gap-3 pr-1">
          <h2 className="text-title-xl font-bold text-black">{title}</h2>
          {showActions ? (
            <div className="flex items-center gap-3">
              <Button
                aria-label="Nova transação"
                variant="solid"
                tone="primary"
                className="h-12 w-12 rounded-full! p-0"
                onClick={() => setIsAddingTransaction(true)}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Button>
              <span title={!areTransactionActionsEnabled ? 'Selecione uma transação para editar' : undefined}>
                <Button
                  aria-label="Editar extrato"
                  variant="solid"
                  tone="primary"
                  className="h-12 w-12 rounded-full! p-0"
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
              </span>
              <span title={!areTransactionActionsEnabled ? 'Selecione uma transação para excluir' : undefined}>
                <Button
                  aria-label="Excluir extrato"
                  variant="solid"
                  tone="primary"
                  className="h-12 w-12 rounded-full! p-0"
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
              </span>
            </div>
          ) : null}
        </div>

        {deleteFeedback ? (
          <div className="mt-3">
            <Alert variant="error" message={deleteFeedback} onClose={() => setDeleteFeedback(null)} />
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-3">
            <Alert variant="error" message={errorMessage} />
          </div>
        ) : null}

        {isLoading ? <p className="mt-3 text-body-sm text-subtle">Carregando transações...</p> : null}

        <ul className="mt-3 space-y-3">
          {visibleTransactions.map((transaction) => (
            <li
              key={transaction.id}
              onClick={() => setSelectedTransactionId(transaction.id)}
              className={[
                'cursor-pointer border-b border-secondary/35 py-2 transition-colors',
                activeSelectedTransactionId === transaction.id ? 'bg-surface-soft' : '',
              ].join(' ')}
            >
              <div className="flex items-stretch justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-semibold text-secondary">
                    {formatTransactionMonthLabel(transaction.date)}
                  </p>
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
                </div>
                <div className="flex flex-none flex-col items-end justify-between">
                  <span className="text-body-sm text-subtle">
                    {formatTransactionDateLabel(transaction.date)}
                  </span>
                  {showTransactionId ? (
                    <span className="text-body-sm text-subtle">{transaction.id}</span>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>

        {!isLoading && visibleTransactions.length === 0 ? (
          <p className="mt-3 text-body-sm text-subtle">Nenhuma transação encontrada.</p>
        ) : null}

        {viewAllHref ? (
          <div className="mt-4">
            <Link
              href={viewAllHref}
              className="block w-full rounded-md border border-primary py-2 text-center text-body-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Ver todas as transações
            </Link>
          </div>
        ) : null}

        {hasPagination && pagination ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              tone="primary"
              disabled={!pagination.hasPreviousPage || isLoading}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              Anterior
            </Button>
            <span className="text-body-sm text-subtle">
              Página {pagination.page} de {pagination.totalPages || 1}
            </span>
            <Button
              type="button"
              variant="outline"
              tone="primary"
              disabled={!pagination.hasNextPage || isLoading}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              Próxima
            </Button>
          </div>
        ) : null}
      </aside>

      {editingTransaction ? (
        <TransactionModal
          entry={editingTransaction}
          userId={userId}
          onClose={() => setEditingTransactionId(null)}
          onSubmit={withAfterMutation(onEditTransaction)}
        />
      ) : null}

      {isAddingTransaction ? (
        <TransactionModal
          userId={userId}
          onClose={() => setIsAddingTransaction(false)}
          onSubmit={withAfterMutation(onSubmitTransaction)}
        />
      ) : null}
    </>
  );
}
