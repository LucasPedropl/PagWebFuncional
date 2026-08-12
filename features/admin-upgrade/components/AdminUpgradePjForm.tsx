import React from 'react';
import { Input } from '../../../components/ui/Input';
import type { AdminUpgradePjFormValues } from '../schemas/adminUpgradeSchemas';

interface AdminUpgradePjFormProps {
  values: AdminUpgradePjFormValues;
  onChange: <K extends keyof AdminUpgradePjFormValues>(
    field: K,
    value: AdminUpgradePjFormValues[K],
  ) => void;
  logoFile: File | null;
  onLogoChange: (file: File | null) => void;
}

export const AdminUpgradePjForm: React.FC<AdminUpgradePjFormProps> = ({
  values,
  onChange,
  logoFile,
  onLogoChange,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 space-y-4">
    <div>
      <h2 className="text-base font-semibold text-slate-900">Dados da empresa</h2>
      <p className="text-sm text-slate-500 mt-1">
        Esses dados criam seu estabelecimento via cadastro PJ.
      </p>
    </div>
    <Input
      label="Nome do estabelecimento"
      value={values.nome}
      onChange={(e) => onChange('nome', e.target.value)}
      placeholder="Ex.: Academia Horizonte"
    />
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        label="CNPJ"
        value={values.cnpj}
        onChange={(e) => onChange('cnpj', e.target.value)}
        placeholder="00.000.000/0000-00"
      />
      <Input
        label="Telefone"
        value={values.telefone}
        onChange={(e) => onChange('telefone', e.target.value)}
        placeholder="(00) 00000-0000"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo (opcional)</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onLogoChange(e.target.files?.[0] ?? null)}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
      />
      {logoFile ? (
        <p className="mt-1.5 text-xs text-slate-500 truncate">{logoFile.name}</p>
      ) : null}
    </div>
  </div>
);
