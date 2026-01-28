import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const type = searchParams.get('type') as 'client' | 'business' | null;
  const isBusiness = type === 'business';

  const [formData, setFormData] = useState({
    email: isBusiness ? 'pedrolucasmota2005.pl@gmail.com' : '',
    password: isBusiness ? '123456' : ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isBusiness) {
        // Uses login-admin logic
        await companyService.login(formData.email, formData.password);
        navigate('/business/dashboard');
      } else {
        // Uses login-cliente logic
        await userService.login(formData.email, formData.password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciais inválidas.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={isBusiness ? "Login Administrativo" : "Bem-vindo de volta"} 
      subtitle={isBusiness ? "Acesse o painel do seu estabelecimento" : "Acesse sua conta para gerenciar assinaturas"}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder={isBusiness ? "email@empresa.com" : "seu@email.com"}
        />

        <div className="space-y-1">
          <Input
            label="Senha"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="******"
          />
          <div className="text-right">
            <Link to="#" className="text-xs text-indigo-600 hover:text-indigo-500">
              Esqueceu a senha?
            </Link>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={isLoading} variant={isBusiness ? 'secondary' : 'primary'}>
          {isBusiness ? 'Entrar no Painel' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600">
          Não tem uma conta?{' '}
          <Link to={`/register${type ? `?type=${type}` : ''}`} className="font-medium text-indigo-600 hover:text-indigo-500">
            Cadastre-se
          </Link>
        </p>
        <div className="pt-2 border-t border-gray-100">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
                Trocar tipo de acesso
            </Link>
        </div>
      </div>
    </AuthLayout>
  );
};