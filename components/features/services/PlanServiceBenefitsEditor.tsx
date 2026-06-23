import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { SearchSelect } from '../../ui/SearchSelect';
import { formLabelClass, resolveFormFieldClass } from '../../ui/formStyles';
import { LocalService, PlanServiceBenefit } from '../../../features/services/schemas/serviceTypes';
import { formatServicePrice } from '../../../features/services/utils/serviceFormatters';

interface PlanServiceBenefitsEditorProps {
  services: LocalService[];
  benefits: PlanServiceBenefit[];
  onChange: (benefits: PlanServiceBenefit[]) => void;
}

export const PlanServiceBenefitsEditor: React.FC<PlanServiceBenefitsEditorProps> = ({
  services,
  benefits,
  onChange,
}) => {
  const addBenefit = () => {
    if (services.length === 0) return;
    const firstAvailable = services.find(
      (s) => !benefits.some((b) => b.serviceId === s.id),
    );
    if (!firstAvailable) return;
    onChange([...benefits, { serviceId: firstAvailable.id, quantidade: 1 }]);
  };

  const updateBenefit = (index: number, patch: Partial<PlanServiceBenefit>) => {
    const next = benefits.map((b, i) => (i === index ? { ...b, ...patch } : b));
    onChange(next);
  };

  const removeBenefit = (index: number) => {
    onChange(benefits.filter((_, i) => i !== index));
  };

  const serviceOptions = services.map((s) => ({
    value: s.id,
    label: s.nome,
    subLabel: formatServicePrice(s.preco),
  }));

  if (services.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        Cadastre serviços em <strong>Serviços</strong> antes de vinculá-los ao plano.
        Esta configuração fica salva localmente até o backend estar disponível.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={formLabelClass}>
          Serviços inclusos no plano
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={addBenefit}
          disabled={benefits.length >= services.length}
          className="h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Adicionar serviço
        </Button>
      </div>

      {benefits.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          Nenhum serviço vinculado. Ex: 4x Corte de cabelo por mês.
        </p>
      ) : (
        <div className="space-y-3">
          {benefits.map((benefit, index) => (
            <div
              key={`${benefit.serviceId}-${index}`}
              className="flex flex-col sm:flex-row gap-3 items-start sm:items-end bg-slate-50 p-3 rounded-lg border border-slate-100"
            >
              <div className="flex-1 w-full">
                <SearchSelect
                  label="Serviço"
                  options={serviceOptions}
                  value={benefit.serviceId}
                  onChange={(value) =>
                    updateBenefit(index, { serviceId: String(value) })
                  }
                  placeholder="Selecione o serviço..."
                />
              </div>
              <div className="w-full sm:w-28">
                <label className={`${formLabelClass} block mb-1.5`}>
                  Quantidade
                </label>
                <input
                  type="number"
                  min={1}
                  value={benefit.quantidade}
                  onChange={(e) =>
                    updateBenefit(index, {
                      quantidade: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                  className={resolveFormFieldClass()}
                />
              </div>
              <button
                type="button"
                onClick={() => removeBenefit(index)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        Os direitos do plano (ex: 4 cortes/mês) ficam salvos localmente neste navegador.
      </p>
    </div>
  );
};
