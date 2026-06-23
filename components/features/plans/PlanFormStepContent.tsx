import React from 'react';
import { Textarea } from '../../ui/Textarea';
import { PlanServiceBenefitsEditor } from '../services/PlanServiceBenefitsEditor';
import { PlanFormContentStepProps } from './planFormTypes';

export const PlanFormStepContent: React.FC<PlanFormContentStepProps> = ({
  formData,
  onInputChange,
  planBenefits,
  onBenefitsChange,
  catalogServices,
}) => (
  <div className="space-y-6">
    <p className="text-sm text-slate-500">
      Funcionalidades são benefícios textuais do plano. Serviços vinculam itens do seu
      catálogo com quantidade mensal (ex: 4 cortes de cabelo).
    </p>

    <Textarea
      label={
        <>
          Funcionalidades <span className="text-slate-400 font-normal">(uma por linha)</span>
        </>
      }
      name="funcionalidades"
      value={formData.funcionalidades}
      onChange={onInputChange}
      rows={5}
      placeholder={'Suporte 24h\nAcesso ilimitado\nDesconto em produtos'}
    />

    <PlanServiceBenefitsEditor
      services={catalogServices}
      benefits={planBenefits}
      onChange={onBenefitsChange}
    />
  </div>
);
