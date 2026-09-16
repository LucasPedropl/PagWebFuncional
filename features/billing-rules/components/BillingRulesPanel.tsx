import React from 'react';
import {
  Save,
  RotateCcw,
  Percent,
  Bell,
  MessageSquare,
  Mail,
  Calculator,
  Info,
} from 'lucide-react';
import { useBillingRules } from '../hooks/useBillingRules';
import { calculateLateCharges } from '../utils/lateCharges';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Toggle } from '../../../components/ui/Toggle';
import { InfoTooltip } from '../../../components/ui/InfoTooltip';

interface BillingRulesPanelProps {
  idEmpresa: number | null;
}

const formatBRL = (val: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(val) ? val : 0,
  );

export const BillingRulesPanel: React.FC<BillingRulesPanelProps> = ({ idEmpresa }) => {
  const {
    formState,
    errors,
    isValid,
    isDirty,
    isLoading,
    isSaving,
    parsedRules,
    setFieldValue,
    toggleReguaItem,
    handleSave,
    handleResetToDefault,
  } = useBillingRules(idEmpresa);

  // Live simulation: 10 days past due on a R$ 100.00 bill
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const simulation = calculateLateCharges({
    valorOriginal: 100,
    vencimento: tenDaysAgo,
    rules: parsedRules,
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-3 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Carregando regras de cobrança...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Regras de Cobrança</h2>
            <p className="text-sm text-gray-500">
              Configure as taxas, multa, juros por atraso e réguas de notificação para cobranças da sua empresa.
            </p>
          </div>
        </div>
      </div>

      {/* Informational note */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 leading-relaxed">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          As regras de cobrança são aplicadas nos cálculos do aplicativo. O disparo automático por e-mail e WhatsApp via régua de cobrança aguarda suporte no servidor.
        </p>
      </div>

      {/* Section 1: Rates & Charges */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">Taxas e Encargos por Atraso</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Taxa padrão (%)</span>
              <InfoTooltip text="Taxa percentual fixa aplicada sobre o valor original da cobrança." />
            </div>
            <Input
              label=""
              placeholder="0,00"
              value={formState.taxaPadraoPercent}
              onChange={(e) => setFieldValue('taxaPadraoPercent', e.target.value)}
              error={errors.taxaPadraoPercent}
            />
          </div>

          <div>
            <div className="flex items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Multa por atraso (%)</span>
              <InfoTooltip text="Multa única aplicada sobre o valor principal em cobranças vencidas (padrão 2,00%)." />
            </div>
            <Input
              label=""
              placeholder="2,00"
              value={formState.multaAtrasoPercent}
              onChange={(e) => setFieldValue('multaAtrasoPercent', e.target.value)}
              error={errors.multaAtrasoPercent}
            />
          </div>

          <div>
            <div className="flex items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-700">Juros por atraso (% ao mês)</span>
              <InfoTooltip text="Juros mensais pro rata die rateados por dia corrido de atraso (padrão 1,00% ao mês)." />
            </div>
            <Input
              label=""
              placeholder="1,00"
              value={formState.jurosAtrasoMesPercent}
              onChange={(e) => setFieldValue('jurosAtrasoMesPercent', e.target.value)}
              error={errors.jurosAtrasoMesPercent}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Régua de Cobrança */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">Régua de Cobrança (Notificações)</h3>
        </div>
        <p className="text-xs text-slate-500">
          Selecione quando os lembretes automáticos de cobrança deverão ser disparados para os clientes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">5 dias antes do vencimento</p>
              <p className="text-xs text-slate-500">Lembrete prévio de pagamento</p>
            </div>
            <Toggle
              checked={formState.reguaCobranca.cincoDiasAntes}
              onChange={() => toggleReguaItem('cincoDiasAntes')}
              aria-label="Notificar 5 dias antes do vencimento"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">2 dias antes do vencimento</p>
              <p className="text-xs text-slate-500">Aviso de proximidade da data</p>
            </div>
            <Toggle
              checked={formState.reguaCobranca.doisDiasAntes}
              onChange={() => toggleReguaItem('doisDiasAntes')}
              aria-label="Notificar 2 dias antes do vencimento"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">No vencimento</p>
              <p className="text-xs text-slate-500">Alerta de vencimento no dia</p>
            </div>
            <Toggle
              checked={formState.reguaCobranca.noVencimento}
              onChange={() => toggleReguaItem('noVencimento')}
              aria-label="Notificar no vencimento"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <p className="text-sm font-medium text-slate-900">Avisar sempre após o vencimento</p>
              <p className="text-xs text-slate-500">Notificações periódicas de cobrança em atraso</p>
            </div>
            <Toggle
              checked={formState.reguaCobranca.aposVencimento}
              onChange={() => toggleReguaItem('aposVencimento')}
              aria-label="Avisar sempre após o vencimento"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Templates de Mensagem */}
      <div className="space-y-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">Templates de Mensagem</h3>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Mensagem padrão de e-mail</span>
              </div>
              <span
                className={`text-[11px] font-medium ${
                  formState.templateEmail.length > 2000 ? 'text-red-600 font-bold' : 'text-slate-400'
                }`}
              >
                {formState.templateEmail.length} / 2000
              </span>
            </div>
            <Textarea
              rows={4}
              placeholder="Digite o texto institucional que acompanhará o corpo dos e-mails de cobrança..."
              value={formState.templateEmail}
              onChange={(e) => setFieldValue('templateEmail', e.target.value)}
              error={errors.templateEmail}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Mensagem padrão de WhatsApp</span>
              </div>
              <span
                className={`text-[11px] font-medium ${
                  formState.templateWhatsapp.length > 1000 ? 'text-red-600 font-bold' : 'text-slate-400'
                }`}
              >
                {formState.templateWhatsapp.length} / 1000
              </span>
            </div>
            <Textarea
              rows={3}
              placeholder="Digite o modelo de mensagem curta a ser enviada no WhatsApp do cliente..."
              value={formState.templateWhatsapp}
              onChange={(e) => setFieldValue('templateWhatsapp', e.target.value)}
              error={errors.templateWhatsapp}
            />
          </div>
        </div>
      </div>

      {/* Section 4: Live Simulation Block */}
      <div className="p-6 bg-slate-900 text-white rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white tracking-wide">
              Demonstração do Cálculo em Atraso
            </h4>
          </div>
          <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
            Exemplo: R$ 100,00 • 10 dias em atraso
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium">Valor Original</p>
            <p className="text-base font-semibold text-white mt-1">R$ 100,00</p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium">
              Taxa ({parsedRules.taxaPadraoPercent}%)
            </p>
            <p className="text-base font-semibold text-white mt-1">{formatBRL(simulation.taxa)}</p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium">
              Multa ({parsedRules.multaAtrasoPercent}%)
            </p>
            <p className="text-base font-semibold text-amber-400 mt-1">{formatBRL(simulation.multa)}</p>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <p className="text-[11px] text-slate-400 font-medium">
              Juros ({parsedRules.jurosAtrasoMesPercent}% a.m.)
            </p>
            <p className="text-base font-semibold text-amber-400 mt-1">{formatBRL(simulation.juros)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-xs font-medium text-slate-300">Valor Total Atualizado:</span>
          <span className="text-lg font-bold text-emerald-400 tabular-nums">
            {formatBRL(simulation.valorAtualizado)}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={handleResetToDefault}
          disabled={isSaving}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Restaurar padrões
        </Button>

        <Button
          type="button"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={!isDirty || !isValid}
        >
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
};
