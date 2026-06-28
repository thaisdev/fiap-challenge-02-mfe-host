import type { InputHTMLAttributes } from 'react';

export type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
};
