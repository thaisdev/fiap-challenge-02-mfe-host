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
import type { EditTransactionPayload, Transaction } from './interfaces/statement-panel.interfaces';
import { TransactionType } from './interfaces/statement-panel.interfaces';
import type { NewTransactionPayload, NewTransactionResult } from './interfaces/new-transaction-panel.interfaces';
import { deleteReceiptFile, uploadReceiptFile } from '../_services/blob-service';

type TransactionModalBaseProps = {
  userId?: number | null;
  onClose: () => void;
};

export type TransactionModalProps = TransactionModalBaseProps &
  (
    | {
        entry?: undefined;
        onSubmit?: (
          payload: NewTransactionPayload
        ) => Promise<NewTransactionResult> | NewTransactionResult | void;
      }
    | {
        entry: Transaction;
        onSubmit?: (
          payload: EditTransactionPayload
        ) => Promise<NewTransactionResult> | NewTransactionResult | void;
      }
  );

function parseCurrencyInputToValue(value: string) {
  const normalizedValue = value.replace(/\./g, '').replace(',', '.');
  const numericValue = Number(normalizedValue);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;
  return Math.round(numericValue * 100) / 100;
}

function formatValueToInputValue(value: number) {
  const absoluteValue = Math.abs(value);
  const [integerPart, decimalPart] = absoluteValue.toFixed(2).split('.');
  return `${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${decimalPart}`;
}

const transactionOptions: readonly { value: TransactionType; label: string }[] = [
  { value: TransactionType.DEPOSIT, label: 'Depósito' },
  { value: TransactionType.TRANSFER, label: 'Transferência' },
];

export function TransactionModal(props: TransactionModalProps) {
  const { userId, onClose } = props;
  const entry = props.entry;

  const calendarRange = useMemo(() => getTransactionDateRange(), []);
  const [transactionType, setTransactionType] = useState<TransactionType | ''>(() => entry?.type ?? '');
  const [transactionAmount, setTransactionAmount] = useState(() =>
    entry ? formatValueToInputValue(entry.value) : '00,00'
  );
  const [transactionDate, setTransactionDate] = useState(() =>
    entry
      ? (dateOnlyFromTransactionDate(entry.date) ?? getDefaultTransactionDate())
      : getDefaultTransactionDate()
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExistingFileRemoved, setIsExistingFileRemoved] = useState(false);
  const receiptFileRef = useRef<File | null>(null);

  const value = useMemo(() => parseCurrencyInputToValue(transactionAmount), [transactionAmount]);
  const isAmountValid = value > 0;
  const isDateValid = isTransactionDateWithinRange(transactionDate, calendarRange);
  const isTypeValid = entry !== undefined || transactionType !== '';
  const isFormValid = isTypeValid && isAmountValid && isDateValid && !isSubmitting;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    receiptFileRef.current = event.currentTarget.files?.[0] ?? null;
  };

  const handleFileClear = () => {
    receiptFileRef.current = null;
  };

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setFeedback(null);
    if (!isFormValid) return;
    setIsSubmitting(true);

    const newFile = receiptFileRef.current;
    const oldBlobUrl = entry?.receiptFile?.url ?? null;

    Promise.resolve(newFile ? uploadReceiptFile(newFile, userId) : null)
      .then((uploadedFile) => {
        const receiptFile = entry
          ? (uploadedFile ?? (isExistingFileRemoved ? null : (entry.receiptFile ?? null)))
          : uploadedFile;

        const submitPromise = props.entry
          ? props.onSubmit?.({
              transactionId: props.entry.id,
              type: transactionType as TransactionType,
              value,
              transactionDate,
              receiptFile,
            })
          : props.onSubmit?.({
              type: transactionType as TransactionType,
              value,
              transactionDate,
              receiptFile,
            });

        return Promise.resolve(submitPromise).then((result) => {
          if (result && !result.ok) {
            if (uploadedFile) deleteReceiptFile(uploadedFile.url);
            setFeedback(result.message);
            return;
          }

          if (entry && oldBlobUrl && (uploadedFile || isExistingFileRemoved)) {
            deleteReceiptFile(oldBlobUrl);
          }

          onClose();
        });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao enviar comprovante.';
        setFeedback(message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const modalTitleId = entry ? 'edit-transaction-modal-title' : 'new-transaction-modal-title';
  const title = entry ? 'Editar transação' : 'Nova transação';
  const submitLabel = entry ? 'Salvar edição' : 'Adicionar';
  const hasExistingReceipt = Boolean(entry?.receiptFile && !isExistingFileRemoved);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={modalTitleId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="mx-auto w-full max-w-[520px] rounded-md bg-surface p-5 shadow-xl md:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id={modalTitleId} className="text-title-xl font-bold text-black">
            {title}
          </h3>
          <Button
            type="button"
            variant="ghost"
            tone="secondary"
            onClick={onClose}
            aria-label={entry ? 'Fechar edição da transação' : 'Fechar nova transação'}
            className="h-9 px-3"
          >
            Fechar
          </Button>
        </div>

        <form className="mt-6" onSubmit={handleSubmit} noValidate>
          <Select
            label="Tipo de transação"
            id="transaction-type"
            name="transaction-type"
            options={transactionOptions}
            placeholder={entry === undefined ? 'Selecione o tipo de transação' : undefined}
            value={transactionType}
            onChange={(event) => {
              const v = event.currentTarget.value;
              if (v === TransactionType.DEPOSIT || v === TransactionType.TRANSFER || v === '') {
                setTransactionType(v);
              }
            }}
            required
            labelClassName="mb-2 text-body-sm font-semibold text-body"
            selectClassName="h-12 border-primary bg-surface px-4 pr-11 text-title-lg text-body"
          />

          <Input
            label="Valor"
            id="transaction-amount"
            name="transaction-amount"
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
            id="transaction-date"
            name="transaction-date"
            value={transactionDate}
            onChange={setTransactionDate}
            required
            minDate={calendarRange.minDate}
            maxDate={calendarRange.maxDate}
            containerClassName="mt-6"
            labelClassName="mb-2 text-body-sm font-semibold text-body"
            inputClassName="h-12 border-primary bg-surface text-center text-title-lg text-body"
          />

          {hasExistingReceipt && entry?.receiptFile ? (
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
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Abrir comprovante ${entry.receiptFile.filename} em nova aba`}
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
            label={hasExistingReceipt ? 'Substituir comprovante' : 'Comprovante'}
            id="transaction-file"
            name="transaction-file"
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
              {submitLabel}
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
