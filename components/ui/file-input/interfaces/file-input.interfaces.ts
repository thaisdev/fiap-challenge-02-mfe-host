import type { InputHTMLAttributes } from 'react';

export type FileInputClassOptions = {
  className?: string;
};

export type FileInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
};
