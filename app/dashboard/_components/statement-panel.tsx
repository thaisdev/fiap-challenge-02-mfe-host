'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { EditStatementEntryModal } from './edit-statement-entry-modal';
import {
  formatStatementEntryTypeLabel,
  StatementEntry,
} from './interfaces/statement-panel.interfaces';
import { formatCurrency } from '@/app/lib/calc';
import { useAuthSessionContext } from '@/app/context/auth-session-context';

type StatementPanelProps = {
  title?: string;
  ariaLabel?: string;
  editableYear?: number | null;
  showActions?: boolean;
  entries?: StatementEntry[];
};

export function StatementPanel({
  title = 'Extrato',
  ariaLabel = 'Extrato da conta',
  showActions = true,
  entries = [],
}: StatementPanelProps) {
  const { statementEntries, onDeleteStatementEntry, onEditStatementEntry } =
    useAuthSessionContext()!;

  const visibleStatementEntries = entries.length > 0 ? entries : statementEntries;

  const panelRef = useRef<HTMLElement | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  const selectedEntry =
    visibleStatementEntries.find((entry) => entry.id === selectedEntryId) ?? null;
  const activeSelectedEntryId = selectedEntry?.id ?? null;
  const areEntryActionsEnabled = activeSelectedEntryId !== null;

  useEffect(() => {
    const handleOutsidePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (panelRef.current?.contains(target)) {
        return;
      }

      setSelectedEntryId(null);
    };

    document.addEventListener('mousedown', handleOutsidePointerDown);
    document.addEventListener('touchstart', handleOutsidePointerDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsidePointerDown);
      document.removeEventListener('touchstart', handleOutsidePointerDown);
    };
  }, []);

  const handleDeleteSelectedEntry = () => {
    if (!activeSelectedEntryId) {
      return;
    }

    onDeleteStatementEntry(activeSelectedEntryId);
    setEditingEntryId(null);
  };

  const handleEditSelectedEntry = () => {
    if (!activeSelectedEntryId) {
      return;
    }

    setEditingEntryId(activeSelectedEntryId);
  };

  const editingEntry = visibleStatementEntries.find((entry) => entry.id === editingEntryId) ?? null;

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
                disabled={!areEntryActionsEnabled}
                onClick={handleEditSelectedEntry}
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
                disabled={!areEntryActionsEnabled}
                onClick={handleDeleteSelectedEntry}
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

        <ul className="mt-3 space-y-3">
          {visibleStatementEntries.map((entry) => (
            <li
              key={entry.id}
              onClick={() => setSelectedEntryId(entry.id)}
              className={[
                'cursor-pointer border-b border-secondary/35 pb-2 transition-colors',
                activeSelectedEntryId === entry.id ? 'bg-surface-soft' : '',
              ].join(' ')}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-body-sm font-semibold text-secondary">{entry.month}</span>
                <span className="text-body-sm text-subtle">{entry.date}</span>
              </div>
              <p className="text-body-md text-heading">
                {formatStatementEntryTypeLabel(entry.type)}
              </p>
              <p className="text-title-lg font-semibold text-black">
                {formatCurrency(entry.amount)}
              </p>
            </li>
          ))}
        </ul>
      </aside>

      {editingEntry ? (
        <EditStatementEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntryId(null)}
          onSubmit={onEditStatementEntry}
        />
      ) : null}
    </>
  );
}
