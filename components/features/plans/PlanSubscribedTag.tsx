import React from 'react';
import { CheckCircle2 } from 'lucide-react';

/** Indica que o usuário já possui vínculo com este plano. */
export const PlanSubscribedTag: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-[10px] font-semibold text-green-800 shrink-0 ${className}`}
  >
    <CheckCircle2 className="w-3 h-3" />
    Já assinado
  </span>
);
