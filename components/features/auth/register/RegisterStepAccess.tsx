import React from 'react';
import { Mail, Lock } from 'lucide-react';
import { AuthInput } from '../AuthInput';
import { RegisterStepProps } from './registerTypes';

export const RegisterStepAccess: React.FC<RegisterStepProps> = ({
  formData,
  isEmailLocked,
  onChange,
}) => (
  <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
    <div>
      <h4 className="text-sm font-bold text-slate-900">Dados de acesso</h4>
      <p className="text-xs text-slate-500 mt-1">Serão usados para login e recuperação da conta.</p>
    </div>

    <AuthInput
      label="E-mail"
      name="email"
      type="email"
      icon={Mail}
      value={formData.email}
      onChange={onChange}
      required
      placeholder="seu@email.com"
      disabled={isEmailLocked}
      className={isEmailLocked ? 'bg-slate-50 text-slate-500' : ''}
      autoComplete="email"
    />

    <AuthInput
      label="Senha"
      name="password"
      type="password"
      icon={Lock}
      value={formData.password}
      onChange={onChange}
      required
      placeholder="Mínimo 6 caracteres"
      minLength={6}
      autoComplete="new-password"
    />

    <AuthInput
      label="Confirmar senha"
      name="confirmPassword"
      type="password"
      icon={Lock}
      value={formData.confirmPassword}
      onChange={onChange}
      required
      placeholder="Repita a senha"
      minLength={6}
      autoComplete="new-password"
    />
  </div>
);
