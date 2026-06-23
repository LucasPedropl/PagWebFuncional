import React, { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { AuthInput } from '../../components/features/auth/AuthInput';
import { AuthAlert } from '../../components/features/auth/AuthAlert';
import { getAuthTheme } from '../../utils/authTheme';

const CLIENT_LOGIN_DEFAULTS = {
  email: 'pedrolucasmota2005@gmail.com',
  password: '123123',
};

const BUSINESS_LOGIN_DEFAULTS = {
  email: 'pedrolucasmota2005.pl@gmail.com',
  password: '123123',
};

const getLoginDefaults = (business: boolean) =>
  business ? BUSINESS_LOGIN_DEFAULTS : CLIENT_LOGIN_DEFAULTS;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rawType = searchParams.get('type');
  const type = rawType?.split('?')[0] as 'client' | 'business' | null;
  const isBusiness = type === 'business';
  const audience = isBusiness ? 'business' : 'client';
  const theme = getAuthTheme(audience);

  const [formData, setFormData] = useState(() => getLoginDefaults(isBusiness));

  useEffect(() => {
    setFormData(getLoginDefaults(isBusiness));
  }, [isBusiness]);

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
        navigate('/business/dashboard');
      } else {
        await userService.login(formData.email, formData.password);
        localStorage.setItem('pagweb_active_view', 'client');
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Credenciais inválidas.';
      setError(message);
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

        <div className="flex justify-end">
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
