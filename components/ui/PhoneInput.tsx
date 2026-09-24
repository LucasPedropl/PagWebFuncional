import React from 'react';
import { SearchSelect } from './SearchSelect';
import { countries } from '../../data/countries';
import { formLabelClass, FORM_RADIUS, resolveFormFieldClass } from './formStyles';

interface PhoneInputProps {
  label: string;
  value?: string;
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
    icon: (
      <span className="text-base leading-none" aria-hidden>
        {c.flag}
      </span>
    ),
  }));

  const selectedCountry =
    countries.find((c) => c.ddi === ddi) ?? countries.find((c) => c.ddi === '55');

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className={formLabelClass}>{label}</label>
      <div className="flex gap-2">
        <div className="w-[4.75rem] shrink-0">
          <SearchSelect
            options={countryOptions}
            value={ddi}
            onChange={(val) => onDdiChange(val.toString())}
            disabled={disabled}
            className="h-full"
            roundedClass={selectRadiusClass}
            placeholder="+00"
            renderSelected={() => (
              <span className="flex items-center gap-1.5 min-w-0">
                <span
                  className="inline-flex h-5 w-5 items-center justify-center text-[15px] leading-none shrink-0"
                  aria-hidden
                  title={selectedCountry?.name}
                >
                  {selectedCountry?.flag ?? '🌐'}
                </span>
                <span className="text-xs font-semibold tabular-nums text-slate-800 truncate">
                  +{ddi || '00'}
                </span>
              </span>
            )}
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
            aria-label={label}
          />
        </div>
      </div>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  );
};
