/** Estilos compartilhados dos campos de formulário (login/cadastro). */
export const FORM_RADIUS = 'rounded-[5px]';

export const formLabelClass = 'text-sm font-medium text-slate-700';

const formFieldShared = `w-full py-2.5 border ${FORM_RADIUS} bg-white text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-offset-0`;

export const formFieldDefaultClass = `${formFieldShared} border-slate-200 focus:ring-slate-900/10 focus:border-slate-400`;

export const formFieldErrorClass = `${formFieldShared} border-red-400 focus:ring-red-200`;

export const formFieldDisabledClass = 'bg-slate-50 cursor-not-allowed text-slate-500';

export const formInputClass = `${formFieldDefaultClass} px-3.5`;

export const formTextareaClass = `${formInputClass} resize-none`;

export const formSelectClass = `${formInputClass} appearance-none pr-10 shadow-sm`;

export const formSearchInputClass = `${formFieldDefaultClass} pl-10 pr-4 text-sm`;

export const formFilterInputClass = `${formFieldDefaultClass} text-sm`;

export const formFilterInputWithIconClass = `${formFieldDefaultClass} text-sm pr-8`;

export const formChatInputClass = `${formFieldDefaultClass} flex-1 text-sm`;

export function resolveFormFieldClass(options?: {
  error?: boolean | string;
  disabled?: boolean;
  className?: string;
}): string {
  const { error, disabled, className = '' } = options ?? {};
  const base = error ? formFieldErrorClass : formFieldDefaultClass;
  const disabledCls = disabled ? formFieldDisabledClass : '';
  return [base, 'px-3.5', disabledCls, className].filter(Boolean).join(' ');
}
