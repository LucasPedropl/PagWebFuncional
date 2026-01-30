import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CheckCircle2, Loader2 } from 'lucide-react';

export const Activate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  // Data passed from Register screen
  // inviteCompanyId: ID da empresa que convidou o usuário (se houver)
  const { password, isBusinessRegistration, companyData, inviteCompanyId } = location.state || {};

  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

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
          disabled={!!location.state?.email}
        />

        <Input
          label="Token de Ativação"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          placeholder="Ex: 123456"
        />

        {statusMessage && (
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