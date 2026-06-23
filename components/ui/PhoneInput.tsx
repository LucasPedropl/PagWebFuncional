import React from 'react';
import { SearchSelect } from './SearchSelect';
import { countries } from '../../data/countries';
import { formLabelClass, FORM_RADIUS, resolveFormFieldClass } from './formStyles';

interface PhoneInputProps {
  label: string;
  value: string;
  ddi: string;
  onDdiChange: (ddi: string) => void;
  phoneNumber: string;
  onPhoneChange: (phone: string) => void;
  error?: string;
  disabled?: boolean;
  inputRadiusClass?: string;
  selectRadiusClass?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  ddi,
  onDdiChange,
  phoneNumber,
  onPhoneChange,
  error,
  disabled = false,
  inputRadiusClass = FORM_RADIUS,
  selectRadiusClass = FORM_RADIUS,
}) => {
  const countryOptions = countries.map((c) => ({
    value: c.ddi,
    label: `+${c.ddi}`,
    subLabel: c.name,
    icon: <span>{c.flag}</span>,
  }));

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className={formLabelClass}>{label}</label>
      <div className="flex gap-2">
        <div className="w-24 shrink-0">
          <SearchSelect
            options={countryOptions}
            value={ddi}
            onChange={(val) => onDdiChange(val.toString())}
            disabled={disabled}
            className="h-full"
            roundedClass={selectRadiusClass}
            placeholder="+00"
          />
        </div>
        <div className="flex-1 relative">
          <input
            type="tel"
            disabled={disabled}
            value={phoneNumber}
            onChange={(e) => onPhoneChange(e.target.value)}
            className={`${resolveFormFieldClass({ error: !!error, disabled })} ${inputRadiusClass}`}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
};
