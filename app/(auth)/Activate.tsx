import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Loader2 } from 'lucide-react';

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

  // Data passed from Register screen
  // inviteCompanyId: ID da empresa que convidou o usuário (se houver)
  const { password, isBusinessRegistration, companyData, inviteCompanyId } = location.state || {};

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlToken = searchParams.get('token');

    if (urlEmail) setEmail(urlEmail);
    else if (location.state?.email) setEmail(location.state.email);

    if (urlToken) setToken(urlToken);

    // Auto-activate if both are present in URL
    if (urlEmail && urlToken && !autoActivateAttempted.current) {
      autoActivateAttempted.current = true;
      handleAutoActivate(urlEmail, urlToken);
    }
  }, [searchParams, location.state]);

  useEffect(() => {
    const currentEmail = searchParams.get('email') || location.state?.email;
    if (currentEmail && sessionStorage.getItem('isRandomTest') === 'true') {
      const fetchToken = async () => {
        try {
          const res = await fetch('https://lojas.vlks.com.br/api/zTemporario/dev/lista-usuarios');
          if (res.ok) {
            const data = await res.json();
            const user = data.find((u: any) => u.email === currentEmail);
            if (user && user.verificationToken) {
              setToken(user.verificationToken);
              sessionStorage.removeItem('isRandomTest');
            }
          }
        } catch (e) {
          console.error('Erro ao buscar token dev:', e);
        }
      };
      fetchToken();
    }
  }, [searchParams, location.state]);

  const handleAutoActivate = async (autoEmail: string, autoToken: string) => {
    setIsLoading(true);
    setError(null);
    setStatusMessage("Verificando link de ativação...");

    try {
      await userService.activate({ email: autoEmail, token: autoToken });
      setStatusMessage("Conta ativada com sucesso! Redirecionando para login...");
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Link de ativação inválido ou expirado. Tente novamente.');
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setStatusMessage(null);

    try {
      // 1. Activate User
      setStatusMessage("Ativando conta de usuário...");
      await userService.activate({ email, token });

      // === Client Registration Flow ===
      if (!isBusinessRegistration) {
         if (password) {
             // Auto-login se a senha estiver disponível
             setStatusMessage("Autenticando...");
             await userService.login(email, password);

             // Se houver um ID de convite, fazemos a vinculação
             if (inviteCompanyId) {
                try {
                    setStatusMessage("Vinculando à empresa...");
                    await userService.linkToCompany(inviteCompanyId);
                } catch (linkError) {
                    console.warn("Erro ao vincular automaticamente:", linkError);
                    // Não bloqueamos o fluxo se falhar o vínculo, mas logamos
                }
             }

             setStatusMessage("Redirecionando...");
             navigate('/dashboard');
         } else {
             // Fluxo manual
             setStatusMessage("Conta ativada! Redirecionando para login...");
             setIsSuccess(true);
             setTimeout(() => navigate('/login'), 2000);
         }
         return;
      }

      // === Business Registration Flow ===
      if (isBusinessRegistration && password && companyData) {
         
         // 2. Login as Client to get Token
         setStatusMessage("Autenticando usuário...");
         const authResponse = await userService.login(email, password);
         const clientToken = authResponse.token;

         // 3. Create Company
         setStatusMessage("Registrando empresa...");
         await companyService.create(clientToken, companyData);

         // 4. Login as Admin
         setStatusMessage("Acessando painel administrativo...");
         await companyService.login(email, password);

         // 5. Redirect to Dashboard
         setStatusMessage("Tudo pronto!");
         navigate('/business/dashboard');
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Token inválido ou erro durante a configuração da conta.');
      setStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Conta Ativada!" subtitle="Sua conta foi verificada com sucesso.">
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-slate-600 text-center">
            {statusMessage || "Redirecionando para o login..."}
          </p>
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin mt-4" />
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Ativar Conta" 
      subtitle="Verifique seu email e insira o código de ativação enviado."
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="seu@email.com"
          disabled={!!location.state?.email || !!searchParams.get('email')}
        />

        <Input
          label="Token de Ativação"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          placeholder="Ex: 123456"
        />

        {statusMessage && !isSuccess && (
            <div className="flex items-center justify-center p-3 bg-blue-50 text-blue-700 text-sm rounded-lg">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {statusMessage}
            </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={isLoading}>
          {isBusinessRegistration ? 'Ativar e Configurar Empresa' : (inviteCompanyId ? 'Ativar e Vincular' : 'Ativar Conta')}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-800 underline">
          Voltar para Login
        </Link>
      </div>
    </AuthLayout>
  );
};