import React from 'react';
import { formLabelClass, resolveFormFieldClass } from './formStyles';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => (
  <div className="flex flex-col gap-1.5">
    {label ? <label className={formLabelClass}>{label}</label> : null}
    <textarea
      className={`${resolveFormFieldClass({ error: !!error, disabled: props.disabled, className })} resize-none`}
      {...props}
    />
    {error ? <span className="text-xs text-red-500">{error}</span> : null}
  </div>
);
