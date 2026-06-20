'use client';

import { type ChangeEvent, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CalendarInput } from '@/components/ui/calendar-input';
import { FileInput } from '@/components/ui/file-input';
import { Input, Select } from '@/components/ui/input';
import { formatCurrencyInput } from '../_utils/currency-mask';
import {
  dateOnlyFromTransactionDate,
  getDefaultTransactionDate,
  getTransactionDateRange,
  isTransactionDateWithinRange,
} from '../_utils/transaction-date';
import type {
  EditTransactionPayload,
  EditTransactionResult,
  ReceiptFile,
  Transaction,
} from './interfaces/statement-panel.interfaces';
import { TransactionType } from './interfaces/statement-panel.interfaces';

type EditStatementEntryModalProps = {
  entry: Transaction;
  onClose: () => void;
  onSubmit?: (payload: EditTransactionPayload) => Promise<EditTransactionResult> | EditTransactionResult | void;
};

function parseCurrencyInputToValue(value: string) {
  const normalizedValue = value.replace(/\./g, '').replace(',', '.');
  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return Math.round(numericValue * 100) / 100;
}

function formatValueToInputValue(value: number) {
  const absoluteValue = Math.abs(value);
  const [integerPart, decimalPart] = absoluteValue.toFixed(2).split('.');
  const normalizedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${normalizedInteger},${decimalPart}`;
}

export function EditStatementEntryModal({
  entry,
  onClose,
  onSubmit,
}: EditStatementEntryModalProps) {
  const calendarRange = useMemo(() => getTransactionDateRange(), []);
  const [transactionType, setTransactionType] = useState<TransactionType>(entry.type);
  const [transactionAmount, setTransactionAmount] = useState(() =>
    formatValueToInputValue(entry.value)
  );
  const [transactionDate, setTransactionDate] = useState(
    () => dateOnlyFromTransactionDate(entry.date) ?? getDefaultTransactionDate()
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExistingFileRemoved, setIsExistingFileRemoved] = useState(false);
  const newReceiptFileRef = useRef<ReceiptFile | null>(null);
  const transactionOptions: readonly { value: TransactionType; label: string }[] = [
    { value: TransactionType.DEPOSIT, label: 'Depósito' },
    { value: TransactionType.TRANSFER, label: 'Transferência' },
  ];

  const value = useMemo(
    () => parseCurrencyInputToValue(transactionAmount),
    [transactionAmount]
  );
  const isAmountValid = value > 0;
  const isDateValid = isTransactionDateWithinRange(transactionDate, calendarRange);
  const isFormValid = isAmountValid && isDateValid && !isSubmitting;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (newReceiptFileRef.current) {
      URL.revokeObjectURL(newReceiptFileRef.current.url);
    }
    const file = event.currentTarget.files?.[0] ?? null;
    newReceiptFileRef.current = file
      ? { url: URL.createObjectURL(file), filename: file.name }
      : null;
  };

  const handleFileClear = () => {
    if (newReceiptFileRef.current) {
      URL.revokeObjectURL(newReceiptFileRef.current.url);
    }
    newReceiptFileRef.current = null;
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);

    Promise.resolve(
      onSubmit?.({
        transactionId: entry.id,
        type: transactionType,
        value,
        transactionDate,
        receiptFile: newReceiptFileRef.current ?? (isExistingFileRemoved ? null : (entry.receiptFile ?? null)),
      })
    )
      .then((result) => {
        if (result && !result.ok) {
          setFeedback(result.message);
          return;
        }

        onClose();
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-statement-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="mx-auto w-full max-w-[520px] rounded-md bg-surface p-5 shadow-xl md:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id="edit-statement-modal-title" className="text-title-xl font-bold text-black">
            Editar transação
          </h3>
          <Button
            type="button"
            variant="ghost"
            tone="secondary"
            onClick={onClose}
            aria-label="Fechar edição da transação"
            className="h-9 px-3"
          >
            Fechar
          </Button>
        </div>

        <form className="mt-6" onSubmit={handleSubmit} noValidate>
          <Select
            label="Tipo de transação"
            id="edit-transaction-type"
            name="edit-transaction-type"
            options={transactionOptions}
            value={transactionType}
            onChange={(event) => {
              const value = event.currentTarget.value;

              if (value === TransactionType.DEPOSIT || value === TransactionType.TRANSFER) {
                setTransactionType(value);
              }
            }}
            required
            labelClassName="mb-2 text-body-sm font-semibold text-body"
            selectClassName="h-12 border-primary bg-surface px-4 pr-11 text-title-lg text-body"
          />

          <Input
            label="Valor"
            id="edit-transaction-amount"
            name="edit-transaction-amount"
            type="text"
            inputMode="numeric"
            value={transactionAmount}
            onChange={(event) =>
              setTransactionAmount(formatCurrencyInput(event.currentTarget.value))
            }
            required
            containerClassName="mt-6"
            labelClassName="mb-2 text-body-sm font-semibold text-body"
            inputClassName="h-12 border-primary bg-surface text-center text-title-lg text-body"
            validationKind="none"
          />

          <CalendarInput
            label="Data"
            id="edit-transaction-date"
            name="edit-transaction-date"
            value={transactionDate}
            onChange={setTransactionDate}
            required
            minDate={calendarRange.minDate}
            maxDate={calendarRange.maxDate}
            containerClassName="mt-6"
            labelClassName="mb-2 text-body-sm font-semibold text-body"
            inputClassName="h-12 border-primary bg-surface text-center text-title-lg text-body"
          />

          {entry.receiptFile && !isExistingFileRemoved ? (
            <div className="mt-6">
              <p className="mb-2 text-body-sm font-semibold text-body">Comprovante atual</p>
              <div className="flex items-center gap-2">
                <span
                  className="min-w-0 flex-1 truncate text-body-xs text-subtle"
                  title={entry.receiptFile.filename}
                >
                  {entry.receiptFile.filename}
                </span>
                <a
                  href={entry.receiptFile.url}
                  download={entry.receiptFile.filename}
                  aria-label={`Baixar comprovante ${entry.receiptFile.filename}`}
                  className="inline-flex h-6 w-6 flex-none cursor-pointer items-center justify-center rounded-sm text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                    <path
                      d="M12 3v12m0 0l-4-4m4 4l4-4M3 19h18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </a>
                <button
                  type="button"
                  aria-label="Excluir comprovante"
                  onClick={() => setIsExistingFileRemoved(true)}
                  className="inline-flex h-6 w-6 flex-none cursor-pointer items-center justify-center rounded-sm text-subtle transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                >
                  ×
                </button>
              </div>
            </div>
          ) : null}

          <FileInput
            label={entry.receiptFile && !isExistingFileRemoved ? 'Substituir comprovante' : 'Comprovante'}
            id="edit-transaction-file"
            name="edit-transaction-file"
            accept="image/*,.pdf"
            containerClassName="mt-6"
            labelClassName="mb-2 text-body-sm font-semibold text-body"
            inputClassName="border-primary"
            onChange={handleFileChange}
            onClear={handleFileClear}
          />

          {feedback ? (
            <div className="mt-4">
              <Alert variant="error" message={feedback} onClose={() => setFeedback(null)} />
            </div>
          ) : null}

          <div className="mt-6 flex items-center gap-3">
            <Button type="submit" variant="solid" tone="primary" disabled={!isFormValid}>
              Salvar edição
            </Button>
            <Button type="button" variant="outline" tone="secondary" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
