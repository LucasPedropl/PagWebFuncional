import React, { useState } from 'react';
import { Eye, EyeOff, LucideIcon } from 'lucide-react';
import { formLabelClass, resolveFormFieldClass } from '../../ui/formStyles';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({
  label,
  icon: Icon,
  error,
  className = '',
  type = 'text',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="flex flex-col gap-1.5">
      <label className={formLabelClass}>{label}</label>
      <div className="relative">
        {Icon ? (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        ) : null}
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          className={`${resolveFormFieldClass({ error: !!error, className })} ${
            Icon ? 'pl-10' : ''
          } ${isPassword ? 'pr-10' : ''}`}
          {...props}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        ) : null}
      </div>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
};
