import React from 'react';
import { AuthInput } from '../AuthInput';
import { AuthAvatarUploadField } from '../AuthAvatarUploadField';
import { PhoneInput } from '../../../ui/PhoneInput';
import { RegisterStepProps } from './registerTypes';

export const RegisterStepCompany: React.FC<RegisterStepProps> = ({
  formData,
  audience,
  onChange,
  onFileChange,
  onPhoneChange,
  onDdiChange,
}) => (
  <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
    <div>
      <h4 className="text-sm font-bold text-slate-900">Dados do estabelecimento</h4>
      <p className="text-xs text-slate-500 mt-1">
        Informações exibidas para clientes na vitrine e nos contratos.
      </p>
    </div>

    <AuthInput
      label="Nome da empresa / estabelecimento"
      name="companyNome"
      value={formData.companyNome}
      onChange={onChange}
      required
      placeholder="Minha Loja LTDA"
      autoComplete="organization"
    />

    <AuthInput
      label="CPF ou CNPJ"
      name="companyCnpj"
      value={formData.companyCnpj}
      onChange={onChange}
      required
      placeholder="00.000.000/0000-00"
      maxLength={18}
      autoComplete="off"
    />

    <PhoneInput
      label="Telefone comercial"
      ddi={formData.companyDdi}
      onDdiChange={(val) => onDdiChange('companyDdi', val)}
      phoneNumber={formData.companyTelefone}
      onPhoneChange={(val) => onPhoneChange('companyTelefone', val)}
      inputRadiusClass="rounded-[5px]"
      selectRadiusClass="rounded-[5px]"
    />

    <AuthAvatarUploadField
      label="Logo da empresa"
      hint="PNG ou SVG com fundo transparente."
      previewUrl={formData.companyLogoUrl}
      name="companyLogo"
      onChange={onFileChange}
      audience={audience}
      variant="logo"
    />
  </div>
);
