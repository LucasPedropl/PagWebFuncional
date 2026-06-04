import React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface AuthAlertProps {
  variant: 'error' | 'success' | 'info';
  children: React.ReactNode;
}

export const AuthAlert: React.FC<AuthAlertProps> = ({ variant, children }) => {
  const styles = {
    error: 'bg-red-50 text-red-800 border-red-100',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    info: 'bg-blue-50 text-blue-800 border-blue-100',
  };

  const Icon = variant === 'error' ? AlertCircle : variant === 'success' ? CheckCircle2 : Loader2;

  return (
    <div
      className={`flex items-start gap-2.5 p-3.5 text-sm rounded-[5px] border ${styles[variant]}`}
      role="alert"
    >
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${variant === 'info' ? 'animate-spin' : ''}`} />
      <span className="leading-relaxed">{children}</span>
    </div>
  );
};
