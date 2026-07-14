import React, { useState, useEffect } from 'react';
import { AuthInput } from '../../../components/features/auth/AuthInput';
import { EnderecoInput } from '../schemas/enderecoSchemas';

interface EnderecoFormFieldsProps {
  value: EnderecoInput;
  onChange: (next: EnderecoInput) => void;
  disabled?: boolean;
  title?: string;
  subtitle?: string;
  onCepValidated?: (isValid: boolean) => void;
}

const formatCep = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
};

/** Campos dumb de endereço residencial/comercial com autocompletar e busca de CEP. */
export const EnderecoFormFields: React.FC<EnderecoFormFieldsProps> = ({
  value,
  onChange,
  disabled = false,
  title = 'Endereço',
  subtitle,
  onCepValidated,
}) => {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [cepSuccess, setCepSuccess] = useState(false);

  const setField = (field: keyof EnderecoInput, fieldValue: string) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanCep = rawVal.replace(/\D/g, '').slice(0, 8);

    setField('cep', cleanCep);

    if (cleanCep.length < 8) {
      setCepError(null);
      setCepSuccess(false);
      onCepValidated?.(false);
      return;
    }

    setCepLoading(true);
    setCepError(null);
    setCepSuccess(false);
    onCepValidated?.(false);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      if (!response.ok) throw new Error('Erro na rede');

      const data = await response.json();
      if (data.erro) {
        setCepError('CEP não encontrado na base nacional.');
        onCepValidated?.(false);
      } else {
        onChange({
          ...value,
          cep: cleanCep,
          rua: data.logradouro || value.rua,
          bairro: data.bairro || value.bairro,
          cidade: data.localidade || value.cidade,
          estado: data.uf || value.estado,
        });
        setCepSuccess(true);
        onCepValidated?.(true);
      }
    } catch (err) {
      console.error('[CEP Search Error]', err);
      setCepError('Falha ao validar CEP online. Preencha os campos abaixo.');
      // Se der erro de rede/API, permitimos avançar se o CEP tiver 8 dígitos e for preenchido manualmente
      onCepValidated?.(true);
    } finally {
      setCepLoading(false);
    }
  };

  // Se o CEP já estiver preenchido (ex: em edição), marca como validado
  useEffect(() => {
    const cleanCep = value.cep.replace(/\D/g, '');
    if (cleanCep.length === 8 && !cepError && !cepLoading && !cepSuccess) {
      onCepValidated?.(true);
    }
  }, [value.cep, onCepValidated, cepError, cepLoading, cepSuccess]);

  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div>
          {title ? <h4 className="text-sm font-bold text-slate-900">{title}</h4> : null}
          {subtitle ? <p className="text-xs text-slate-500 mt-1">{subtitle}</p> : null}
        </div>
      )}

      <div className="relative">
        <AuthInput
          label="CEP"
          name="cep"
          value={formatCep(value.cep)}
          onChange={handleCepChange}
          required
          placeholder="00000-000"
          maxLength={9}
          disabled={disabled || cepLoading}
          autoComplete="postal-code"
        />
        {cepLoading && (
          <span className="absolute right-3 top-9 text-[10px] text-slate-400 animate-pulse">
            Buscando CEP...
          </span>
        )}
        {cepSuccess && (
          <span className="absolute right-3 top-9 text-[10px] text-emerald-600 font-medium">
            ✓ Encontrado
          </span>
        )}
        {cepError && (
          <p className="text-[10px] text-rose-500 mt-1 pl-1">
            {cepError}
          </p>
        )}
      </div>

      <AuthInput
        label="Rua / logradouro"
        name="rua"
        value={value.rua}
        onChange={(e) => setField('rua', e.target.value)}
        required
        placeholder="Rua das Flores"
        disabled={disabled || cepLoading}
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
          disabled={disabled || cepLoading}
        />
        <AuthInput
          label="Bairro"
          name="bairro"
          value={value.bairro}
          onChange={(e) => setField('bairro', e.target.value)}
          required
          placeholder="Centro"
          disabled={disabled || cepLoading}
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
            disabled={disabled || cepLoading}
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
          disabled={disabled || cepLoading}
          autoComplete="address-level1"
        />
      </div>
    </div>
  );
};
