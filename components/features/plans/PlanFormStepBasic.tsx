import React from 'react';
import { Input } from '../../ui/Input';
import { PlanFormStepProps } from './planFormTypes';

export const PlanFormStepBasic: React.FC<PlanFormStepProps> = ({
  formData,
  onInputChange,
}) => (
  <div className="space-y-4">
    <p className="text-sm text-gray-500">
      Defina o nome e os valores financeiros do plano de assinatura mensal.
    </p>
    <Input
      label="Nome do Plano"
      placeholder="Ex: Plano Premium"
      name="nome"
      value={formData.nome}
      onChange={onInputChange}
      required
    />
    <Input
      label="Preço Mensal (R$)"
      placeholder="99.90"
      type="number"
      step="0.01"
      min="0"
      name="valorMensalidade"
      value={formData.valorMensalidade}
      onChange={onInputChange}
      required
    />
    <div className="grid grid-cols-2 gap-4">
      <Input
        label="Multa (%)"
        placeholder="2.00"
        type="number"
        step="0.01"
        min="0"
        name="percentualMulta"
        value={formData.percentualMulta}
        onChange={onInputChange}
      />
      <Input
        label="Juros Mensal (%)"
        placeholder="1.00"
        type="number"
        step="0.01"
        min="0"
        name="percentualJurosMensal"
        value={formData.percentualJurosMensal}
        onChange={onInputChange}
      />
    </div>
  </div>
);
