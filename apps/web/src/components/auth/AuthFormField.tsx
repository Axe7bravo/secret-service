import type { InputHTMLAttributes } from 'react';

interface AuthFormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function AuthFormField({ label, id, ...inputProps }: AuthFormFieldProps) {
  return <div className="auth-field">
    <label htmlFor={id}>{label}</label>
    <input id={id} {...inputProps} />
  </div>;
}
