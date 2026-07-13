import React from 'react';
import { AuthInput } from '../../../components/features/auth/AuthInput';
import { EnderecoInput } from '../schemas/enderecoSchemas';

interface EnderecoFormFieldsProps {
  value: EnderecoInput;
  onChange: (next: EnderecoInput) => void;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
}

const formatCep = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

/** Campos dumb de endereço residencial/comercial. */
export const EnderecoFormFields: React.FC<EnderecoFormFieldsProps> = ({
  value,
  onChange,
  disabled = false,
  title = 'Endereço',
  subtitle,
}) => {
  const setField = (field: keyof EnderecoInput, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div>
          {title ? <h4 className="text-sm font-bold text-slate-900">{title}</h4> : null}
          {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
        </div>
      )}

      <AuthInput
        label="CEP"
        name="cep"
        value={formatCep(value.cep)}
        onChange={(e) => setField('cep', e.target.value.replace(/\D/g, '').slice(0, 8))}
        required
        placeholder="00000-000"
        maxLength={9}
        disabled={disabled}
        autoComplete="postal-code"
      />

      <AuthInput
        label="Rua / logradouro"
        name="rua"
        value={value.rua}
        onChange={(e) => setField('rua', e.target.value)}
        required
        placeholder="Rua das Flores"
        disabled={disabled}
        autoComplete="street-address"
      />

      <div className="grid grid-cols-2 gap-3">
        <AuthInput
          label="Número"
          name="numero"
          value={value.numero}
          onChange={(e) => setField('numero', e.target.value)}
          required
          placeholder="123"
          disabled={disabled}
        />
        <AuthInput
          label="Bairro"
          name="bairro"
          value={value.bairro}
          onChange={(e) => setField('bairro', e.target.value)}
          required
          placeholder="Centro"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <AuthInput
            label="Cidade"
            name="cidade"
            value={value.cidade}
            onChange={(e) => setField('cidade', e.target.value)}
            required
            placeholder="São Paulo"
            disabled={disabled}
            autoComplete="address-level2"
          />
        </div>
        <AuthInput
          label="UF"
          name="estado"
          value={value.estado}
          onChange={(e) => setField('estado', e.target.value.toUpperCase().slice(0, 2))}
          required
          placeholder="SP"
          maxLength={2}
          disabled={disabled}
          autoComplete="address-level1"
        />
      </div>
    </div>
  );
};
