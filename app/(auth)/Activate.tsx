import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { enderecoService } from '../../features/address/services/enderecoService';
import { EnderecoInput } from '../../features/address/schemas/enderecoSchemas';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { AuthOtpInput } from '../../components/features/auth/AuthOtpInput';
import { AuthAlert } from '../../components/features/auth/AuthAlert';
import { getAuthTheme } from '../../utils/authTheme';

const OTP_LENGTH = 6;

export const Activate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const autoActivateAttempted = useRef(false);

  const { password, isBusinessRegistration, companyData, inviteCompanyId, endereco } =
    (location.state || {}) as {
      password?: string;
      isBusinessRegistration?: boolean;
      companyData?: {
        nome: string;
        cnpj: string;
        telefone: string;
        logo: File | null;
      };
      inviteCompanyId?: number;
      endereco?: EnderecoInput;
    };
  const audience = isBusinessRegistration ? 'business' : 'client';
  const theme = getAuthTheme(audience);

  const handleAutoActivate = async (autoEmail: string, autoToken: string) => {
    setIsLoading(true);
    setError(null);
    setStatusMessage('Verificando link de ativação...');
    try {
      await userService.activate({ email: autoEmail, token: autoToken });
      setIsSuccess(true);
      setStatusMessage('Conta ativada! Redirecionando...');
      setTimeout(
        () => navigate(`/login?type=${audience === 'business' ? 'business' : 'client'}`),
        3000
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Link inválido ou expirado.';
      setError(message);
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlToken = searchParams.get('token');
    if (urlEmail) setEmail(urlEmail);
    else if (location.state?.email) setEmail(location.state.email);
    if (urlToken) setToken(urlToken.toUpperCase());

    if (urlEmail && urlToken && !autoActivateAttempted.current) {
      autoActivateAttempted.current = true;
      void handleAutoActivate(urlEmail, urlToken);
    }
  }, [searchParams, location.state, audience, navigate]);

  useEffect(() => {
    const currentEmail = searchParams.get('email') || location.state?.email;
    if (currentEmail && sessionStorage.getItem('isRandomTest') === 'true') {
      void (async () => {
        try {
          const res = await fetch('https://lojas.vlks.com.br/api/zTemporario/dev/lista-usuarios');
          if (!res.ok) return;
          const data = await res.json();
          const user = data.find((u: { email: string }) => u.email === currentEmail);
          if (user?.verificationToken) {
            setToken(String(user.verificationToken).toUpperCase());
            sessionStorage.removeItem('isRandomTest');
          }
        } catch (e) {
          console.error('[PagWeb] Erro ao buscar token dev:', e);
        }
      })();
    }
  }, [searchParams, location.state]);

  const runActivation = async (tokenValue: string) => {
    if (!email.trim()) {
      setError('E-mail não encontrado. Volte ao cadastro ou use o link completo do e-mail.');
      return;
    }
    if (tokenValue.length < OTP_LENGTH) {
      setError(`Informe o código completo (${OTP_LENGTH} caracteres).`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      setStatusMessage('Ativando sua conta...');
      await userService.activate({ email, token: tokenValue });

      if (!isBusinessRegistration) {
        if (password) {
          setStatusMessage('Autenticando...');
          await userService.login(email, password);
          if (endereco) {
            try {
              setStatusMessage('Salvando endereço...');
              await enderecoService.createForUser(endereco);
            } catch (addrErr) {
              console.error('[Activate] Endereço cliente:', addrErr);
            }
          }
          if (inviteCompanyId) {
            try {
              await userService.linkToCompany(inviteCompanyId);
            } catch (linkError) {
              console.warn('[PagWeb] Vínculo automático:', linkError);
            }
          }
          navigate('/dashboard');
        } else {
          setIsSuccess(true);
          setStatusMessage('Conta ativada! Redirecionando para login...');
          setTimeout(() => navigate('/login?type=client'), 2000);
        }
        return;
      }

      if (password && companyData) {
        setStatusMessage('Configurando empresa...');
        const authResponse = await userService.login(email, password);
        await companyService.create(authResponse.token, companyData);
        setStatusMessage('Acessando painel...');
        await companyService.login(email, password);
        if (endereco) {
          try {
            setStatusMessage('Salvando endereço da empresa...');
            await enderecoService.createForEmpresa(endereco);
          } catch (addrErr) {
            console.error('[Activate] Endereço empresa:', addrErr);
          }
        }
        navigate('/business/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha na ativação.';
      setError(message);
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runActivation(token);
  };

  const subtitle = email
    ? `Digite o código de ${OTP_LENGTH} caracteres enviado para ${email}.`
    : `Digite o código de ${OTP_LENGTH} caracteres que você recebeu por e-mail.`;

  if (isSuccess) {
    return (
      <AuthLayout audience={audience} title="Conta ativada!" subtitle="Tudo certo com sua verificação.">
        <div className="flex flex-col items-center py-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-[5px] bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <p className="text-sm text-slate-600">{statusMessage}</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      audience={audience}
      title="Ativar conta"
      subtitle={subtitle}
      footer={
        <p className="text-center text-sm text-slate-600">
          <Link
            to={`/login?type=${audience === 'business' ? 'business' : 'client'}`}
            className={`font-semibold hover:underline ${theme.linkClass}`}
          >
            Voltar ao login
          </Link>
        </p>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
            Código de ativação
          </p>
          <AuthOtpInput
            value={token}
            onChange={setToken}
            length={OTP_LENGTH}
            disabled={isLoading}
          />
        </div>

        {statusMessage && <AuthAlert variant="info">{statusMessage}</AuthAlert>}
        {error && <AuthAlert variant="error">{error}</AuthAlert>}

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={token.length < OTP_LENGTH || isLoading}
          className={`w-full h-12 rounded-[5px] text-white border-0 ${theme.buttonClass}`}
        >
          {isBusinessRegistration ? 'Ativar e configurar empresa' : 'Confirmar ativação'}
        </Button>
      </form>
    </AuthLayout>
  );
};
