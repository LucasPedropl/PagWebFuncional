import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatCNPJ, formatCPF, formatPhone } from '../../utils/formatters';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const type = searchParams.get('type') as 'client' | 'business' | null;
  const isBusiness = type === 'business';
  
  const [formData, setFormData] = useState({
    // User Data
    nome: '',
    sobreNome: '',
    cpf: '',
    email: '',
    password: '',
    telefone: '',
    // Company Data (Only if isBusiness)
    companyNome: '',
    companyCnpj: '',
    companyTelefone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const name = e.target.name;

    // Apply Masks
    if (name === 'cpf') value = formatCPF(value);
    if (name === 'companyCnpj') value = formatCNPJ(value);
    if (name === 'telefone' || name === 'companyTelefone') value = formatPhone(value);

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Clean masks before sending if necessary, but API might accept formatted
      // Assuming API needs clean data:
      const cleanCPF = formData.cpf.replace(/\D/g, '');
      const cleanPhone = formData.telefone.replace(/\D/g, '');
      const cleanCNPJ = formData.companyCnpj.replace(/\D/g, '');
      const cleanCompPhone = formData.companyTelefone.replace(/\D/g, '');

      // Step 1: Always register the User first
      await userService.register({
        nome: formData.nome,
        sobreNome: isBusiness ? 'Admin' : formData.sobreNome,
        cpf: cleanCPF, // sending clean
        email: formData.email,
        password: formData.password,
        telefone: cleanPhone // sending clean
      });

      // Prepare state to pass to Activate screen
      const navigationState = { 
        email: formData.email,
        password: formData.password, // Passed to allow auto-login flow
        isBusinessRegistration: isBusiness,
        companyData: isBusiness ? {
          nome: formData.companyNome,
          cnpj: cleanCNPJ, // sending clean
          telefone: cleanCompPhone // sending clean
        } : null
      };

      navigate('/activate', { state: navigationState });

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao tentar registrar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout 
      title={isBusiness ? "Cadastre seu Negócio" : "Crie sua conta"} 
      subtitle={isBusiness ? "Passo 1: Crie seu usuário administrativo e dados da empresa." : "Preencha os dados abaixo para começar a usar o PagWeb."}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        
        {/* User Section */}
        <div className="space-y-4">
            <h4 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
                {isBusiness ? "Dados do Administrador" : "Seus Dados"}
            </h4>
            
            <div className={isBusiness ? "" : "grid grid-cols-2 gap-4"}>
                <Input
                    label="Nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    required
                    placeholder="Seu nome"
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

            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="CPF"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    required
                    placeholder="000.000.000-00"
                    maxLength={14}
                />
                <Input
                    label="Telefone Pessoal"
                    name="telefone"
                    type="tel"
                    value={formData.telefone}
                    onChange={handleChange}
                    required
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                />
            </div>

            <Input
                label="Email (Login)"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
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
        </div>

        {/* Company Section (Business Only) */}
        {isBusiness && (
            <div className="space-y-4 pt-4">
                <h4 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
                    Dados da Empresa
                </h4>
                
                <Input
                    label="Razão Social / Nome da Empresa"
                    name="companyNome"
                    value={formData.companyNome}
                    onChange={handleChange}
                    required={isBusiness}
                    placeholder="Minha Loja LTDA"
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label="CNPJ"
                        name="companyCnpj"
                        value={formData.companyCnpj}
                        onChange={handleChange}
                        required={isBusiness}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                    />
                    <Input
                        label="Telefone Comercial"
                        name="companyTelefone"
                        value={formData.companyTelefone}
                        onChange={handleChange}
                        required={isBusiness}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                    />
                </div>
            </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full mt-6" isLoading={isLoading} variant={isBusiness ? 'secondary' : 'primary'}>
          {isBusiness ? 'Continuar Cadastro' : 'Criar Conta'}
        </Button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600">
          Já tem uma conta?{' '}
          <Link to={`/login${type ? `?type=${type}` : ''}`} className="font-medium text-slate-700 hover:text-slate-900 underline">
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