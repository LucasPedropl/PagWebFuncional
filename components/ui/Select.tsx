import React from 'react';
import { ChevronDown } from 'lucide-react';
import { formLabelClass, resolveFormFieldClass } from './formStyles';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  hint,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const selectClass = [
    resolveFormFieldClass({ error: !!error, disabled, className }),
    'appearance-none pr-10 shadow-sm',
    disabled ? '' : 'cursor-pointer hover:border-slate-400',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-col gap-1.5">
      {label ? <label className={formLabelClass}>{label}</label> : null}
      <div className="relative">
        <select className={selectClass} disabled={disabled} {...props}>
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 ${
            disabled ? 'opacity-50' : ''
          }`}
        />
      </div>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
};
