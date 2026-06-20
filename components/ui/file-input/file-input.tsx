'use client';

import type { ChangeEvent } from 'react';
import { useState } from 'react';
import type { FileInputClassOptions, FileInputProps } from './interfaces/file-input.interfaces';

const baseClasses =
  'w-full cursor-pointer rounded-md border border-border bg-surface text-body-sm text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 file:mr-3 file:cursor-pointer file:border-0 file:border-r file:border-border file:bg-transparent file:px-4 file:py-4 file:text-body-sm file:font-semibold file:text-body';

export function fileInputClasses({ className }: FileInputClassOptions = {}) {
  return [baseClasses, className].filter(Boolean).join(' ');
}

export function FileInput({
  label,
  id,
  name,
  containerClassName,
  labelClassName,
  inputClassName,
  onChange,
  ...props
}: FileInputProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputId = id ?? name;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    setFileName(file?.name ?? null);
    onChange?.(event);
  };

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
        type="file"
        onChange={handleChange}
        className={fileInputClasses({ className: inputClassName })}
        {...props}
      />
      {fileName ? <p className="truncate text-body-xs text-subtle">{fileName}</p> : null}
    </div>
  );
}
