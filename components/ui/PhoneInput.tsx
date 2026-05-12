import React from 'react';
import { SearchSelect } from './SearchSelect';
import { countries } from '../../data/countries';

interface PhoneInputProps {
  label: string;
  value: string; // O valor completo com DDI ou apenas o número? 
  // Seguindo o pedido do usuário, vamos tratar o DDI separadamente no estado ou enviar junto.
  // Para facilitar a integração, vamos receber as props individualmente.
  ddi: string;
  onDdiChange: (ddi: string) => void;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  error?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  ddi,
  onDdiChange,
  phoneNumber,
  onPhoneChange,
  error,
  disabled = false,
}) => {
  const countryOptions = countries.map(c => ({
    value: c.ddi,
    label: `+${c.ddi}`,
    subLabel: c.name,
    icon: <span>{c.flag}</span>
  }));

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="w-24 shrink-0">
          <SearchSelect
            options={countryOptions}
            value={ddi}
            onChange={(val) => onDdiChange(val.toString())}
            disabled={disabled}
            className="h-full"
            placeholder="+00"
          />
        </div>
        <div className="flex-1 relative">
          <input
            type="tel"
            disabled={disabled}
            value={phoneNumber}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all bg-white text-gray-900 placeholder-gray-400 ${
              error ? 'border-red-500 ring-red-200' : 'border-gray-300'
            } ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'hover:border-gray-400 shadow-sm'}`}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
