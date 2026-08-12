import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { AuthInput } from '../../components/features/auth/AuthInput';
import { AuthAlert } from '../../components/features/auth/AuthAlert';
import { toUserFacingLoginError } from '../../utils/formatters';
import { getAuthTheme } from '../../utils/authTheme';
import {
  LoginAudience,
  rememberedLoginCredentialsService,
} from '../../features/auth/services/rememberedLoginCredentialsService';

const CLIENT_LOGIN_DEFAULTS = {
  email: 'pedrolucasmota2005.pl@gmail.com',
  password: '123123',
};

const BUSINESS_LOGIN_DEFAULTS = {
  email: 'pedrolucasmota2005@gmail.com',
  password: 'plm200510',
};

const getLoginDefaults = (business: boolean) =>
  business ? BUSINESS_LOGIN_DEFAULTS : CLIENT_LOGIN_DEFAULTS;

const resolveInitialLoginForm = (audience: LoginAudience, business: boolean) => {
  const remembered = rememberedLoginCredentialsService.load(audience);
  if (remembered) {
    return { credentials: remembered, remember: true };
  }
  return { credentials: getLoginDefaults(business), remember: false };
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawType = searchParams.get('type');
  const type = rawType?.split('?')[0] as 'client' | 'business' | null;
  const isBusiness = type === 'business';
  const audience: LoginAudience = isBusiness ? 'business' : 'client';
  const theme = getAuthTheme(audience);

  const [formData, setFormData] = useState(
    () => resolveInitialLoginForm(audience, isBusiness).credentials,
  );
  const [rememberCredentials, setRememberCredentials] = useState(
    () => resolveInitialLoginForm(audience, isBusiness).remember,
  );

  useEffect(() => {
    const initial = resolveInitialLoginForm(audience, isBusiness);
    setFormData(initial.credentials);
    setRememberCredentials(initial.remember);
  }, [audience, isBusiness]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isBusiness) {
        await companyService.login(formData.email, formData.password);
        localStorage.setItem('pagweb_active_view', 'business');
      } else {
        await userService.login(formData.email, formData.password);
        localStorage.setItem('pagweb_active_view', 'client');
      }

      if (rememberCredentials) {
        rememberedLoginCredentialsService.save(audience, formData);
      } else {
        rememberedLoginCredentialsService.clear(audience);
      }

      navigate(isBusiness ? '/business/dashboard' : '/dashboard');
    } catch (err: unknown) {
      setError(toUserFacingLoginError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const authFooter = (
    <div className="text-center space-y-4">
      <p className="text-sm text-slate-600">
        Não tem uma conta?{' '}
        <Link
          to={`/register${type ? `?type=${type}` : ''}`}
          className={`font-semibold hover:underline ${theme.linkClass}`}
        >
          Criar conta gratuita
        </Link>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
        <Link to="/" className="hover:text-slate-600 transition-colors">
          Trocar tipo de acesso
        </Link>
        <span className="text-slate-200">|</span>
        <Link
          to={isBusiness ? '/login?type=client' : '/login?type=business'}
          className="hover:text-slate-600 transition-colors"
        >
          {isBusiness ? 'Entrar como cliente' : 'Entrar como estabelecimento'}
        </Link>
      </div>
    </div>
  );

  return (
    <AuthLayout
      audience={audience}
      title={isBusiness ? 'Painel do estabelecimento' : 'Bem-vindo de volta'}
      subtitle={
        isBusiness
          ? 'Acesse sua conta para gerenciar planos, clientes e recebíveis.'
          : 'Entre para acompanhar assinaturas, faturas e conversas com empresas.'
      }
      footer={authFooter}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <AuthInput
            label="E-mail"
            name="email"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={handleChange}
            required
            placeholder={isBusiness ? 'admin@empresa.com' : 'voce@email.com'}
            autoComplete="email"
          />
          <AuthInput
            label="Senha"
            name="password"
            type="password"
            icon={Lock}
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberCredentials}
              onChange={(e) => setRememberCredentials(e.target.checked)}
              className="rounded border-slate-300 text-slate-800 focus:ring-slate-400"
            />
            Lembrar e-mail e senha
          </label>
          <button
            type="button"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
            onClick={() =>
              console.warn('[PagWeb] Recuperação de senha ainda não implementada.')
            }
          >
            Esqueceu a senha?
          </button>
        </div>

        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <Button
          type="submit"
          className={`w-full h-12 rounded-[5px] text-white font-semibold border-0 ${theme.buttonClass}`}
          isLoading={isLoading}
        >
          {isBusiness ? 'Entrar no painel' : 'Entrar na minha conta'}
          {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </form>
    </AuthLayout>
  );
};
