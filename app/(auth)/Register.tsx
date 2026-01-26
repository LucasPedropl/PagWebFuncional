import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { companyService } from '../../services/companyService';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const type = searchParams.get('type') as 'client' | 'business' | null;
  const isBusiness = type === 'business';
  
  // Unified state, but we'll map it to different payloads on submit
  const [formData, setFormData] = useState({
    nome: '',
    sobreNome: '', // Only for user
    cpf: '', // used for CPF (user) or CNPJ (business)
    email: '',
    password: '',
    telefone: ''
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
        // Business Registration
        await companyService.register({
          nome: formData.nome,
          cnpj: formData.cpf, // Mapping 'cpf' input to 'cnpj' payload
          email: formData.email,
          password: formData.password,
          telefone: formData.telefone
        });
        // Business has no activation token flow currently, redirect to login
        navigate(`/login?type=business`);
      } else {
        // User Registration
        await userService.register({
          nome: formData.nome,
          sobreNome: formData.sobreNome,
          cpf: formData.cpf,
          email: formData.email,
          password: formData.password,
          telefone: formData.telefone
        });
        // User flow requires activation
        navigate('/activate', { state: { email: formData.email } });
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao tentar registrar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={isBusiness ? "Cadastre seu Negócio" : "Crie sua conta"} 
      subtitle={isBusiness ? "Gerencie pagamentos e assinaturas de forma profissional." : "Preencha os dados abaixo para começar a usar o PagWeb."}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className={isBusiness ? "" : "grid grid-cols-2 gap-4"}>
          <Input
            label={isBusiness ? "Nome da Empresa" : "Nome"}
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            placeholder={isBusiness ? "Razão Social" : "Seu nome"}
          />
          {!isBusiness && (
            <Input
              label="Sobrenome"
              name="sobreNome"
              value={formData.sobreNome}
              onChange={handleChange}
              required
              placeholder="Sobrenome"
            />
          )}
        </div>
        
        <Input
          label={isBusiness ? "CNPJ (Apenas números)" : "CPF"}
          name="cpf"
          value={formData.cpf}
          onChange={handleChange}
          required
          placeholder={isBusiness ? "00.000.000/0000-00" : "000.000.000-00"}
        />

        <Input
          label="Telefone"
          name="telefone"
          type="tel"
          value={formData.telefone}
          onChange={handleChange}
          required
          placeholder="(00) 00000-0000"
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder={isBusiness ? "email@empresa.com" : "seu@email.com"}
        />

        <Input
          label="Senha"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="******"
          minLength={6}
        />

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={isLoading} variant={isBusiness ? 'secondary' : 'primary'}>
          {isBusiness ? 'Cadastrar Empresa' : 'Criar Conta'}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link to={`/login${type ? `?type=${type}` : ''}`} className="font-medium text-indigo-600 hover:text-indigo-500">
            Fazer login
          </Link>
        </p>
         <div className="pt-2 border-t border-gray-100">
            <Link to="/" className="text-xs text-gray-400 hover:text-gray-600">
                Voltar ao início
            </Link>
        </div>
      </div>
    </AuthLayout>
  );
};