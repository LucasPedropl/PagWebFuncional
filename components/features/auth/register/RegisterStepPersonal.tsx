import React from 'react';
import { AuthInput } from '../AuthInput';
import { AuthAvatarUploadField } from '../AuthAvatarUploadField';
import { PhoneInput } from '../../../ui/PhoneInput';
import { RegisterStepProps } from './registerTypes';

export const RegisterStepPersonal: React.FC<RegisterStepProps> = ({
  formData,
  audience,
  onChange,
  onFileChange,
  onPhoneChange,
  onDdiChange,
}) => {
  const isBusiness = audience === 'business';

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
      <div>
        <h4 className="text-sm font-bold text-slate-900">
          {isBusiness ? 'Dados do administrador' : 'Informações pessoais'}
        </h4>
        <p className="text-xs text-slate-500 mt-1">Usados para identificação e contato.</p>
      </div>

      <div className={isBusiness ? 'space-y-4' : 'grid grid-cols-1 sm:grid-cols-2 gap-4'}>
        <AuthInput
          label="Nome"
          name="nome"
          value={formData.nome}
          onChange={onChange}
          required
          placeholder="Seu nome"
          autoComplete="given-name"
        />
        {!isBusiness && (
          <AuthInput
            label="Sobrenome"
            name="sobreNome"
            value={formData.sobreNome}
            onChange={onChange}
            required
            placeholder="Sobrenome"
            autoComplete="family-name"
          />
        )}
      </div>

      <AuthInput
        label="CPF"
        name="cpf"
        value={formData.cpf}
        onChange={onChange}
        required
        placeholder="000.000.000-00"
        maxLength={14}
        autoComplete="off"
      />

      <PhoneInput
        label={isBusiness ? 'Telefone pessoal' : 'Seu telefone'}
        ddi={formData.ddi}
        onDdiChange={(val) => onDdiChange('ddi', val)}
        phoneNumber={formData.telefone}
        onPhoneChange={(val) => onPhoneChange('telefone', val)}
        inputRadiusClass="rounded-[5px]"
        selectRadiusClass="rounded-[5px]"
      />

      <AuthAvatarUploadField
        label="Foto de perfil (opcional)"
        previewUrl={formData.fotoPerfilUrl}
        name="fotoPerfil"
        onChange={onFileChange}
        audience={audience}
      />
    </div>
  );
};
