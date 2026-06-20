'use client';

import type { FormEventHandler } from 'react';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CalendarInput } from '@/components/ui/calendar-input';
import { Input, Select } from '@/components/ui/input';
import { TransactionType } from './interfaces/new-transaction-panel.interfaces';
import {
  getDefaultTransactionDate,
  getTransactionDateRange,
  isTransactionDateWithinRange,
} from '../_utils/transaction-date';
import { formatCurrencyInput } from '../_utils/currency-mask';
import { useAccountActions } from '../_store/account/account.hooks';

function parseCurrencyInputToValue(value: string) {
  const normalizedValue = value.replace(/\./g, '').replace(',', '.');
  const numericValue = Number(normalizedValue);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return Math.round(numericValue * 100) / 100;
}

export function NewTransactionPanel() {
  const { onSubmitTransaction } = useAccountActions();

  const calendarRange = useMemo(() => getTransactionDateRange(), []);
  const [transactionType, setTransactionType] = useState<TransactionType | ''>('');
  const [transactionAmount, setTransactionAmount] = useState('00,00');
  const [transactionDate, setTransactionDate] = useState(() => getDefaultTransactionDate());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const isFormValid = transactionType !== '' && isAmountValid && isDateValid && !isSubmitting;

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setFeedback(null);

    if (
      transactionType !== TransactionType.DEPOSIT &&
      transactionType !== TransactionType.TRANSFER
    ) {
      return;
    }

    if (!isAmountValid) {
      return;
    }

    if (!isDateValid) {
      return;
    }

    setIsSubmitting(true);

    onSubmitTransaction({
      type: transactionType,
      value,
      transactionDate,
    })
      .then((result) => {
        if (result && !result.ok) {
          setFeedback(result.message);
          return;
        }

        setTransactionType('');
        setTransactionAmount('00,00');
        setTransactionDate(getDefaultTransactionDate());
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <section
      className="relative min-h-[610px] overflow-hidden rounded-md bg-surface-transaction px-9 py-8 mobile:min-h-[580px] mobile:px-5 mobile:py-6 desktop:min-h-[560px] desktop:p-8"
      aria-label="Nova transação"
    >
      <Image
        src="/dashboard/transactions/square-top.svg"
        alt=""
        width={178}
        height={180}
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 hidden desktop:block"
      />
      <Image
        src="/dashboard/transactions/square-bottom.svg"
        alt=""
        width={178}
        height={180}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-0 hidden desktop:block"
      />

      <Image
        src="/dashboard/responsive/squares-top.svg"
        alt=""
        width={600}
        height={402}
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 z-0 desktop:hidden"
      />
      <Image
        src="/dashboard/responsive/squares-bottom.svg"
        alt=""
        width={181}
        height={178}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-0 desktop:hidden"
      />
      <Image
        src="/dashboard/responsive/people-card.svg"
        alt=""
        width={328}
        height={231}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-5 z-0 mobile:right-0 mobile:w-[270px] mobile:max-w-[68%] desktop:hidden"
      />

      <div className="relative z-10 max-w-[420px]">
        <h2 className="text-[3rem] font-bold leading-none text-transaction-text">Nova transação</h2>

        <form className="mt-10 mobile:mt-8" onSubmit={handleSubmit} noValidate>
          <Select
            label="Tipo de transação"
            id="transaction-type"
            name="transaction-type"
            options={transactionOptions}
            placeholder="Selecione o tipo de transação"
            value={transactionType}
            onChange={(event) => {
              const value = event.currentTarget.value;

              if (
                value === TransactionType.DEPOSIT ||
                value === TransactionType.TRANSFER ||
                value === ''
              ) {
                setTransactionType(value);
              }
            }}
            required
            containerClassName=""
            labelClassName="sr-only"
            selectClassName="h-14 border-primary bg-surface px-5 pr-12 text-title-lg text-body focus-visible:ring-primary"
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
            containerClassName="mt-10 max-w-[296px] mobile:mt-8"
            labelClassName="mb-3 text-title-xl font-bold text-transaction-text"
            inputClassName="h-14 border-primary bg-surface text-center text-title-lg text-body focus-visible:ring-primary"
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
            containerClassName="mt-8 max-w-[296px]"
            labelClassName="mb-3 text-title-xl font-bold text-transaction-text"
            inputClassName="h-14 border-primary bg-surface text-center text-title-lg text-body focus-visible:ring-primary"
          />

          <div
            className={['mt-10 w-fit mobile:mt-8', !isFormValid ? 'cursor-not-allowed' : ''].join(
              ' '
            )}
          >
            <Button
              type="submit"
              variant="solid"
              tone="primary"
              className={[
                'h-14 w-full max-w-[296px] text-title-xl font-bold',
                !isFormValid ? 'pointer-events-none' : '',
              ].join(' ')}
              disabled={!isFormValid}
            >
              Concluir transação
            </Button>
          </div>

          {feedback ? (
            <div className="mt-4 max-w-[420px]">
              <Alert variant="error" message={feedback} onClose={() => setFeedback(null)} />
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
