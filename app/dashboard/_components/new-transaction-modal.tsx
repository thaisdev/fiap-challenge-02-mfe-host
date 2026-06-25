'use client';

import { type ChangeEvent, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CalendarInput } from '@/components/ui/calendar-input';
import { FileInput } from '@/components/ui/file-input';
import { Input, Select } from '@/components/ui/input';
import { formatCurrencyInput } from '../_utils/currency-mask';
import {
  getDefaultTransactionDate,
  getTransactionDateRange,
  isTransactionDateWithinRange,
} from '../_utils/transaction-date';
import type { NewTransactionPayload, NewTransactionResult } from './interfaces/new-transaction-panel.interfaces';
import { TransactionType } from './interfaces/new-transaction-panel.interfaces';
import { deleteReceiptFile, uploadReceiptFile } from '../_services/blob-service';

type NewTransactionModalProps = {
  userId?: number | null;
  onClose: () => void;
  onSubmit?: (payload: NewTransactionPayload) => Promise<NewTransactionResult> | NewTransactionResult | void;
};

function parseCurrencyInputToValue(value: string) {
  const normalizedValue = value.replace(/\./g, '').replace(',', '.');
  const numericValue = Number(normalizedValue);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return 0;
  return Math.round(numericValue * 100) / 100;
}

export function NewTransactionModal({ userId, onClose, onSubmit }: NewTransactionModalProps) {
  const calendarRange = useMemo(() => getTransactionDateRange(), []);
  const [transactionType, setTransactionType] = useState<TransactionType | ''>('');
  const [transactionAmount, setTransactionAmount] = useState('00,00');
  const [transactionDate, setTransactionDate] = useState(() => getDefaultTransactionDate());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const receiptFileRef = useRef<File | null>(null);
  const transactionOptions: readonly { value: TransactionType; label: string }[] = [
    { value: TransactionType.DEPOSIT, label: 'Depósito' },
    { value: TransactionType.TRANSFER, label: 'Transferência' },
  ];

  const value = useMemo(() => parseCurrencyInputToValue(transactionAmount), [transactionAmount]);
  const isAmountValid = value > 0;
  const isDateValid = isTransactionDateWithinRange(transactionDate, calendarRange);
  const isFormValid = transactionType !== '' && isAmountValid && isDateValid && !isSubmitting;

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

    if (
      transactionType !== TransactionType.DEPOSIT &&
      transactionType !== TransactionType.TRANSFER
    ) {
      return;
    }

    if (!isFormValid) return;

    setIsSubmitting(true);

    const file = receiptFileRef.current;

    Promise.resolve(file ? uploadReceiptFile(file, userId) : null)
      .then((receiptFile) =>
        Promise.resolve(
          onSubmit?.({
            type: transactionType,
            value,
            transactionDate,
            receiptFile,
          })
        ).then((result) => {
          if (result && !result.ok) {
            if (receiptFile) deleteReceiptFile(receiptFile.url);
            setFeedback(result.message);
            return;
          }
          onClose();
        })
      )
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Erro ao enviar comprovante.';
        setFeedback(message);
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
      aria-labelledby="new-transaction-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="mx-auto w-full max-w-[520px] rounded-md bg-surface p-5 shadow-xl md:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id="new-transaction-modal-title" className="text-title-xl font-bold text-black">
            Nova transação
          </h3>
          <Button
            type="button"
            variant="ghost"
            tone="secondary"
            onClick={onClose}
            aria-label="Fechar nova transação"
            className="h-9 px-3"
          >
            Fechar
          </Button>
        </div>

        <form className="mt-6" onSubmit={handleSubmit} noValidate>
          <Select
            label="Tipo de transação"
            id="new-transaction-type"
            name="new-transaction-type"
            options={transactionOptions}
            placeholder="Selecione o tipo de transação"
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
            id="new-transaction-amount"
            name="new-transaction-amount"
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
            id="new-transaction-date"
            name="new-transaction-date"
            value={transactionDate}
            onChange={setTransactionDate}
            required
            minDate={calendarRange.minDate}
            maxDate={calendarRange.maxDate}
            containerClassName="mt-6"
            labelClassName="mb-2 text-body-sm font-semibold text-body"
            inputClassName="h-12 border-primary bg-surface text-center text-title-lg text-body"
          />

          <FileInput
            label="Comprovante"
            id="new-transaction-file"
            name="new-transaction-file"
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
              Adicionar
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
