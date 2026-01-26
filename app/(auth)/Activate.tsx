import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { CheckCircle2 } from 'lucide-react';

export const Activate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Try to get email from navigation state if available
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await userService.activate({ email, token });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Token inválido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout title="Conta Ativada!">
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600 mb-6">
            Sua conta foi ativada com sucesso. Você será redirecionado para o login em instantes.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            Ir para Login agora
          </Button>
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
        />

        <Input
          label="Token de Ativação"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          required
          placeholder="Ex: 123456"
        />

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Ativar Conta
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
          Voltar para Login
        </Link>
      </div>
    </AuthLayout>
  );
};