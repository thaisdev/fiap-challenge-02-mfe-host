import type { DateInputProps } from './interfaces/date-input.interfaces';

const baseInputClasses =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-body-sm text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60';

export function DateInput({
  label,
  id,
  name,
  value,
  onChange,
  containerClassName,
  labelClassName,
  inputClassName,
  ...props
}: DateInputProps) {
  const inputId = id ?? name;

  return (
    <div className={['space-y-1.5', containerClassName].filter(Boolean).join(' ')}>
      <label
        htmlFor={inputId}
        className={['block text-body-sm font-semibold text-heading', labelClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        type="date"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className={[baseInputClasses, inputClassName].filter(Boolean).join(' ')}
        {...props}
      />
    </div>
  );
}
