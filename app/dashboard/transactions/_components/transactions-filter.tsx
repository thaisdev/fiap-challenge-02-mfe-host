'use client';

import { useState, type FormEventHandler } from 'react';
import { Button } from '@/components/ui/button';
import { DateInput } from '@/components/ui/date-input';
import { Select } from '@/components/ui/input';
import { TransactionType } from '../../_components/interfaces/statement-panel.interfaces';
import type { TransactionFilters } from '../../_services/transaction-service';

type TransactionsFilterProps = {
  onFilter: (filters: TransactionFilters) => void;
  isLoading?: boolean;
};

const typeOptions = [
  { value: TransactionType.DEPOSIT, label: 'Depósito' },
  { value: TransactionType.TRANSFER, label: 'Transferência' },
] as const;

const dateInputClass = 'h-10 border-primary bg-surface px-3 text-body-sm text-body';

export function TransactionsFilter({ onFilter, isLoading }: TransactionsFilterProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('');

  const hasActiveFilters = startDate !== '' || endDate !== '' || type !== '';

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    onFilter({
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      type: type || undefined,
    });
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setType('');
    onFilter({});
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-md bg-surface px-5 py-4"
      aria-label="Filtros de transações"
    >
      <div className="flex flex-wrap items-end gap-4">
        <DateInput
          label="Data início"
          id="filter-start-date"
          name="filter-start-date"
          value={startDate}
          max={endDate || undefined}
          onChange={setStartDate}
          labelClassName="text-body-sm font-semibold text-body"
          inputClassName={dateInputClass}
        />

        <DateInput
          label="Data fim"
          id="filter-end-date"
          name="filter-end-date"
          value={endDate}
          min={startDate || undefined}
          onChange={setEndDate}
          labelClassName="text-body-sm font-semibold text-body"
          inputClassName={dateInputClass}
        />

        <div className="flex flex-col gap-1.5">
          <Select
            label="Tipo"
            id="filter-type"
            name="filter-type"
            options={typeOptions}
            placeholder="Todos os tipos"
            value={type}
            onChange={(e) => setType(e.currentTarget.value)}
            labelClassName="text-body-sm font-semibold text-body"
            selectClassName="h-10 border-primary bg-surface px-3 pr-9 text-body-sm text-body"
          />
        </div>

        <div className="flex items-center gap-2 pb-0.5">
          <Button type="submit" variant="solid" tone="primary" disabled={isLoading}>
            Filtrar
          </Button>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              tone="secondary"
              disabled={isLoading}
              onClick={handleClear}
            >
              Limpar
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
