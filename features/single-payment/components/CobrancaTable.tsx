import React, { useState, useMemo } from 'react';
import { Cobranca } from '../schemas/cobrancaSchemas';
import { SearchSelect } from '../../../components/ui/SearchSelect';
import { InfoTooltip } from '../../../components/ui/InfoTooltip';
import { 
  Search, 
  Receipt, 
  Loader2, 
  AlertCircle, 
  Ban, 
  Wallet,
} from 'lucide-react';

import { CobrancaListaScope } from '../types/cobrancaListaScope';
import { CobrancaScopeTabs } from './CobrancaScopeTabs';

interface CobrancaTableProps {
  cobrancas: Cobranca[];
  isLoading: boolean;
  error: string | null;
  variant?: 'business' | 'client';
  listaScope: CobrancaListaScope;
  onListaScopeChange?: (scope: CobrancaListaScope) => void;
  onCancel?: (id: number) => Promise<void>;
  onPay?: (cobranca: Cobranca) => void;
}

const STATUS_CLASSES: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  Aberto: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
    border: 'border-indigo-100',
  },
  Pago: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-100',
  },
  Atrasado: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    border: 'border-rose-100',
  },
  Cancelado: {
    bg: 'bg-slate-50',
    text: 'text-slate-500',
    dot: 'bg-slate-400',
    border: 'border-slate-100',
  },
  Repassado: {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    dot: 'bg-teal-500',
    border: 'border-teal-100',
  },
};

const getInitials = (name: string): string => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const isCancellable = (c: Cobranca): boolean =>
  c.status === 'Aberto' || c.status === 'Atrasado';

const isPayable = (c: Cobranca): boolean =>
  c.status === 'Aberto' || c.status === 'Atrasado';

export const CobrancaTable: React.FC<CobrancaTableProps> = ({
  cobrancas,
  isLoading,
  error,
  variant = 'business',
  listaScope,
  onListaScopeChange,
  onCancel,
  onPay,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Filtros aplicados em memória
  const filteredCobrancas = useMemo(() => {
    return cobrancas.filter((c) => {
      const clientName = c.usuario?.nome || '';
      const clientEmail = c.usuario?.email || '';
      const companyName = c.empresa?.nome || '';
      const description = c.descricao || '';
      
      const matchesSearch = 
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === 'Todos' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [cobrancas, searchTerm, statusFilter]);

  const handleCancelClick = async (id: number) => {
    if (!onCancel) return;
    if (window.confirm('Tem certeza que deseja cancelar esta cobrança?')) {
      await onCancel(id);
    }
  };

  const isPayerList = listaScope === 'a_pagar';
  const tableTitle = isPayerList ? 'Pagar' : 'Receber';
  const searchPlaceholder = isPayerList
    ? variant === 'client'
      ? 'Buscar por estabelecimento ou descrição...'
      : 'Buscar por credor ou descrição...'
    : variant === 'client'
      ? 'Buscar por pagador ou descrição...'
      : 'Buscar por cliente ou descrição...';
  const partyColumnLabel = isPayerList
    ? variant === 'client'
      ? 'Estabelecimento'
      : 'Credor'
    : variant === 'client'
      ? 'Pagador'
      : 'Cliente';

  const statusOptions = [
    { value: 'Todos', label: 'Todos os status' },
    { value: 'Aberto', label: 'Aberto' },
    { value: 'Pago', label: 'Pago' },
    { value: 'Atrasado', label: 'Atrasado' },
    { value: 'Repassado', label: 'Repassado' },
    { value: 'Cancelado', label: 'Cancelado' },
  ];

  return (
    <div className="bg-white rounded-[5px] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header com totalizadores */}
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-slate-900">{tableTitle}</h2>
        <div className="flex flex-wrap items-center gap-3">
          {onListaScopeChange ? (
            <CobrancaScopeTabs value={listaScope} onChange={onListaScopeChange} />
          ) : null}
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full border border-slate-100">
            {filteredCobrancas.length} de {cobrancas.length} total
          </span>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 bg-slate-50/50 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
        {/* Campo de Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-[5px] focus:outline-none focus:ring-2 focus:ring-slate-950/10 focus:border-slate-400 transition-all placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Campo de Status */}
        <div className="w-full sm:w-52">
          <SearchSelect
            options={statusOptions}
            value={statusFilter}
            onChange={(v) => setStatusFilter(String(v))}
            placeholder="Filtrar status..."
            className="text-xs"
          />
        </div>
      </div>

      {/* Tabela de Cobranças */}
      <div className="flex-1 overflow-x-auto min-h-[300px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-slate-900" />
            <p className="text-sm text-gray-400">Carregando histórico...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6 gap-2">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm font-medium text-slate-900">Erro ao carregar dados</p>
            <p className="text-xs text-gray-400 max-w-xs">{error}</p>
          </div>
        ) : filteredCobrancas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <Receipt className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 font-medium">Nenhuma cobrança encontrada.</p>
            <p className="text-xs text-gray-400 mt-1">Experimente alterar os filtros de busca.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-50/70 text-[11px] text-gray-500 uppercase font-semibold tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-3.5">{partyColumnLabel}</th>
                <th className="px-6 py-3.5">Serviço/Descrição</th>
                <th className="px-6 py-3.5">Valor</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCobrancas.map((c) => {
                const statusStyle = STATUS_CLASSES[c.status] || STATUS_CLASSES.Aberto;
                const partyName = isPayerList
                  ? (c.empresa?.nome ?? '—')
                  : (c.usuario?.nome ?? '—');
                const partySubline = isPayerList
                  ? (c.empresa?.cnpj ?? '')
                  : (c.usuario?.email ?? '');
                const initials = getInitials(partyName);

                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200/50 flex items-center justify-center text-xs shrink-0 shadow-sm group-hover:bg-white transition-colors">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate text-sm leading-tight">
                            {partyName}
                          </p>
                          {partySubline && (
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">
                              {partySubline}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Descrição */}
                    <td className="px-6 py-4 text-slate-700 max-w-[200px] truncate text-sm font-normal">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{c.descricao}</span>
                        {c.observacao && (
                          <InfoTooltip text={c.observacao} popoverRadiusClass="rounded-[5px]" />
                        )}
                      </div>
                    </td>

                    {/* Valor */}
                    <td className="px-6 py-4 font-semibold text-slate-900 text-sm whitespace-nowrap">
                      R$ {c.valorTotal.toFixed(2).replace('.', ',')}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {c.status}
                      </span>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {isPayerList && isPayable(c) && onPay && (
                        <button
                          type="button"
                          onClick={() => onPay(c)}
                          className="text-xs font-semibold text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-[5px] transition-all inline-flex items-center gap-1"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          Pagar
                        </button>
                      )}
                      {!isPayerList && isCancellable(c) && onCancel && (
                        <button
                          type="button"
                          onClick={() => void handleCancelClick(c.id)}
                          className="text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 p-1.5 rounded-[5px] transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 float-right"
                          title="Cancelar cobrança"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
