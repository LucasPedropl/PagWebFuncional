import React from 'react';
import { Box } from 'lucide-react';
import { Input } from '../../ui/Input';
import { SearchSelect } from '../../ui/SearchSelect';
import { FORM_RADIUS } from '../../ui/formStyles';
import { TIPO_CONTRATO } from '../../../utils/api';
import { PlanFormStepProps } from './planFormTypes';

const TIPO_CONTRATO_OPTIONS = [
  { value: TIPO_CONTRATO.Nenhum, label: 'Nenhum' },
  { value: TIPO_CONTRATO.Termo, label: 'Termo de adesão', subLabel: 'Concordância simples' },
  {
    value: TIPO_CONTRATO.Contrato,
    label: 'Contrato (requer assinatura)',
    subLabel: 'Exige assinatura e foto',
  },
];

export const PlanFormStepContract: React.FC<PlanFormStepProps> = ({
  formData,
  onInputChange,
  onFileChange,
}) => (
  <div className="space-y-4">
    <p className="text-sm text-slate-500">
      Regras de contrato, cancelamento e documento PDF opcional.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <SearchSelect
        label="Tipo de contrato"
        value={formData.tipoContrato}
        options={TIPO_CONTRATO_OPTIONS}
        onChange={(value) =>
          onInputChange({
            target: { name: 'tipoContrato', value: String(value) },
          } as React.ChangeEvent<HTMLSelectElement>)
        }
        hint="Termo: concordância simples. Contrato: exige assinatura e foto."
      />
      <Input
        label="Dias p/ cancelamento"
        type="number"
        min={0}
        name="cancelamentoDias"
        value={formData.cancelamentoDias}
        onChange={onInputChange}
      />
    </div>

    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        name="assinarPorCliente"
        checked={formData.assinarPorCliente}
        onChange={onInputChange}
        className={`${FORM_RADIUS} border-slate-300`}
      />
      Permitir que o cliente assine este plano diretamente
    </label>

    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        Contrato / Termo de adesão (PDF)
      </label>
      <div className="relative group">
        <input
          type="file"
          accept=".pdf"
          onChange={onFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div
          className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 ${FORM_RADIUS} bg-slate-50 group-hover:border-slate-900 group-hover:bg-slate-50 transition-all`}
        >
          <div className={`p-2 bg-white ${FORM_RADIUS} border border-slate-200 shadow-sm`}>
            <Box className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {formData.contrato ? formData.contrato.name : 'Clique para selecionar o contrato'}
            </p>
            <p className="text-xs text-slate-500">Apenas arquivos PDF</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
