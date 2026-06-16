'use client';

import { useEffect, useMemo, useState, type FormEventHandler } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CalendarInput } from '@/components/ui/calendar-input';
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
  Transaction,
} from './interfaces/statement-panel.interfaces';
import { TransactionType } from './interfaces/statement-panel.interfaces';

type EditStatementEntryModalProps = {
  entry: Transaction;
  onClose: () => void;
  onSubmit?: (payload: EditTransactionPayload) => EditTransactionResult | void;
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
  const isFormValid = isAmountValid && isDateValid;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setFeedback(null);

    if (!isFormValid) {
      return;
    }

    const result = onSubmit?.({
      transactionId: entry.id,
      type: transactionType,
      value,
      transactionDate,
    });

    if (result && !result.ok) {
      setFeedback(result.message);
      return;
    }

    onClose();
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
