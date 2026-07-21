import React from 'react';
import {
  COBRANCA_LISTA_SCOPE_LABELS,
  CobrancaListaScope,
} from '../types/cobrancaListaScope';

interface CobrancaScopeTabsProps {
  value: CobrancaListaScope;
  onChange: (scope: CobrancaListaScope) => void;
  className?: string;
}

export const CobrancaScopeTabs: React.FC<CobrancaScopeTabsProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const scopes: CobrancaListaScope[] = ['a_pagar', 'criadas'];

  return (
    <div
      className={`inline-flex rounded-[5px] border border-slate-200 bg-slate-50/80 p-0.5 ${className}`}
      role="tablist"
      aria-label="Tipo de cobrança"
    >
      {scopes.map((scope) => {
        const isActive = value === scope;
        return (
          <button
            key={scope}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(scope)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-[4px] transition-all ${
              isActive
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {COBRANCA_LISTA_SCOPE_LABELS[scope]}
          </button>
        );
      })}
    </div>
  );
};
