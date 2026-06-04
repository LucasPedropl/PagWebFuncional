import React from 'react';
import { User, Store } from 'lucide-react';
import { AuthAudience, getAuthTheme } from '../../../utils/authTheme';

interface AuthAvatarUploadFieldProps {
  label: string;
  hint?: string;
  previewUrl: string;
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  audience: AuthAudience;
  variant?: 'avatar' | 'logo';
}

export const AuthAvatarUploadField: React.FC<AuthAvatarUploadFieldProps> = ({
  label,
  hint,
  previewUrl,
  name,
  onChange,
  audience,
  variant = 'avatar',
}) => {
  const fileBtnClass = getAuthTheme(audience).fileButtonClass;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-[5px] border border-slate-200/80 bg-slate-50/80">
      <div className="w-20 h-20 rounded-[5px] border-2 border-white shadow-md overflow-hidden bg-white flex items-center justify-center shrink-0">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Preview"
            className={`w-full h-full ${variant === 'logo' ? 'object-contain p-2' : 'object-cover'}`}
          />
        ) : variant === 'logo' ? (
          <Store className="w-9 h-9 text-slate-300" />
        ) : (
          <User className="w-9 h-9 text-slate-300" />
        )}
      </div>
      <div className="flex-1 space-y-1.5 w-full text-center sm:text-left">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
          {label}
        </label>
        {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
        <input
          type="file"
          name={name}
          accept="image/*"
          onChange={onChange}
          className={`block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-[5px] file:border-0 file:text-xs file:font-semibold file:text-white ${fileBtnClass}`}
        />
      </div>
    </div>
  );
};
