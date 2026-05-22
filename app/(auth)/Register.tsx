
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { userService } from '../../services/userService';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { formatCNPJ, formatCPF, formatPhone, formatCPFOrCNPJ } from '../../utils/formatters';
import { ChevronRight, ChevronLeft, Store } from 'lucide-react';
import { PhoneInput } from '../../components/ui/PhoneInput';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  // Limpa o parâmetro type caso venha sujo da URL (ex: client?Id=4)
  const rawType = searchParams.get('type');
  const type = rawType?.split('?')[0] as 'client' | 'business' | null;
  const isBusiness = type === 'business';
  
  // Estado para armazenar ID da empresa caso venha por convite
  const [inviteCompanyId, setInviteCompanyId] = useState<number | null>(null);
  const [isEmailLocked, setIsEmailLocked] = useState(false);
  
  const [formData, setFormData] = useState({
    // User Data
    nome: '',
    sobreNome: '',
    cpf: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefone: '',
    fotoPerfil: null as File | null,
    // Company Data (Only if isBusiness)
    companyNome: '',
    companyCnpj: '',
    companyTelefone: '',
    companyLogo: null as File | null,
    fotoPerfilUrl: '',
    companyLogoUrl: '',
    ddi: '55',
    companyDdi: '55'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const file = e.target.files?.[0] || null;
    
    if (file) {
        const previewUrl = URL.createObjectURL(file);
        if (name === 'fotoPerfil') {
            setFormData(prev => ({
              ...prev,
              [name]: file,
              fotoPerfilUrl: previewUrl
            }));
        } else if (name === 'companyLogo') {
            setFormData(prev => ({
              ...prev,
              [name]: file,
              companyLogoUrl: previewUrl
            }));
        }
    } else {
        setFormData(prev => ({
          ...prev,
          [name]: file
        }));
    }
  };

  // Effect para processar a URL de convite (incluindo formato com duplo ?)
  useEffect(() => {
    // Tenta pegar via searchParams padrão
    let emailFromUrl = searchParams.get('email');
    let idFromUrl = searchParams.get('Id');

    // Se falhar (devido ao formato ?type=client?Id=4), fazemos parse manual da string completa
    if (!emailFromUrl || !idFromUrl) {
        const href = window.location.href;
        
        // Regex para encontrar email=...
        const emailMatch = href.match(/[?&]email=([^&]+)/);
        if (emailMatch) {
            emailFromUrl = decodeURIComponent(emailMatch[1]);
        }

        // Regex para encontrar Id=...
        const idMatch = href.match(/[?&]Id=(\d+)/);
        if (idMatch) {
            idFromUrl = idMatch[1];
        }
    }

    if (emailFromUrl) {
        setFormData(prev => ({ ...prev, email: emailFromUrl as string }));
        setIsEmailLocked(true);
    }

    if (idFromUrl) {
        setInviteCompanyId(parseInt(idFromUrl));
    }
  }, [searchParams]);

  // Temporary testing helper for business password
  useEffect(() => {
    if (isBusiness) {
      setFormData(prev => ({
        ...prev,
        password: '123123',
        confirmPassword: '123123'
      }));
    }
  }, [isBusiness]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const name = e.target.name;

    // Apply Masks
    if (name === 'cpf') value = formatCPF(value);
    if (name === 'companyCnpj') value = formatCPFOrCNPJ(value);
    if (name === 'telefone' || name === 'companyTelefone') value = formatPhone(value);

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (name: 'telefone' | 'companyTelefone', value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: formatPhone(value)
    }));
  };

  const handleDdiChange = (name: 'ddi' | 'companyDdi', value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.nome || (!isBusiness && !formData.sobreNome) || !formData.cpf || !formData.telefone) {
        setError('Por favor, preencha todos os campos.');
        return false;
      }
      if (formData.cpf.length < 14) {
        setError('CPF inválido.');
        return false;
      }
      if (formData.telefone.length < 14) {
        setError('Telefone inválido.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError('Por favor, preencha todos os campos.');
        return false;
      }
      if (formData.password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('As senhas não coincidem.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) return;

    // If it's not the final step, just go to the next step
    if ((isBusiness && step < 3) || (!isBusiness && step < 2)) {
      handleNext();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cleanCPF = formData.cpf.replace(/\D/g, '');
      const cleanPhone = formData.telefone.replace(/\D/g, '');
      const cleanCNPJ = formData.companyCnpj.replace(/\D/g, '');
      const cleanCompPhone = formData.companyTelefone.replace(/\D/g, '');

      // Step 1: Register User
      // Passa o ID da empresa se existir (convite)
      await userService.register({
        nome: formData.nome,
        sobreNome: isBusiness ? 'Admin' : formData.sobreNome,
        cpf: cleanCPF,
        email: formData.email,
        password: formData.password,
        telefone: formData.ddi + cleanPhone,
        fotoPerfil: formData.fotoPerfil
      }, inviteCompanyId || undefined);

      // CASO ESPECIAL: Convite por Link (Id da empresa presente)
      // O backend já vincula e ativa o usuário, então fazemos login automático
      if (inviteCompanyId) {
          await userService.login(formData.email, formData.password);
          navigate('/dashboard');
          return;
      }

      // CASO PADRÃO: Redireciona para tela de ativação manual
      const navigationState = { 
        email: formData.email,
        password: formData.password, 
        isBusinessRegistration: isBusiness,
        companyData: isBusiness ? {
          nome: formData.companyNome,
          cnpj: cleanCNPJ,
          telefone: formData.companyDdi + cleanCompPhone,
          logo: formData.companyLogo
        } : null
      };

      navigate('/activate', { state: navigationState });

    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('IX_User_Cpf') || msg.includes('duplicate key') && msg.includes('Cpf')) {
        setError('Este CPF já está cadastrado no sistema.');
      } else if (msg.includes('IX_User_Email') || (msg.includes('duplicate key') && msg.includes('Email'))) {
        setError('Este e-mail já está em uso.');
      } else {
        setError(msg || 'Ocorreu um erro ao tentar registrar.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = isBusiness ? 3 : 2;

  return (
    <AuthLayout 
      title={isBusiness ? "Cadastre seu Negócio" : "Crie sua conta"} 
      subtitle={inviteCompanyId ? "Complete seu cadastro para se vincular à empresa." : (isBusiness ? `Passo ${step} de ${totalSteps}` : `Passo ${step} de ${totalSteps}`)}
    >
      <div className="mb-6 flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-2.5 h-2.5 rounded-full ${step >= i + 1 ? (isBusiness ? 'bg-slate-900' : 'bg-blue-600') : 'bg-gray-200'}`} />
            {i < totalSteps - 1 && (
              <div className={`w-8 h-0.5 ${step > i + 1 ? (isBusiness ? 'bg-slate-900' : 'bg-blue-600') : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
        
        {/* Temporary Test Button */}
        <div className="mb-4">
          <Button 
            type="button" 
            variant="outline" 
            className="w-full text-xs bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
            onClick={() => {
              const random = Math.floor(Math.random() * 10000);
              const randomCPF = `${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}`;
              setFormData(prev => ({
                ...prev,
                nome: `Teste ${random}`,
                sobreNome: `User ${random}`,
                cpf: randomCPF,
                email: isEmailLocked ? prev.email : `teste${random}@example.com`,
                password: isBusiness ? '123123' : 'password123',
                confirmPassword: isBusiness ? '123123' : 'password123',
                telefone: `(11) 9${Math.floor(Math.random() * 8999 + 1000)}-${Math.floor(Math.random() * 8999 + 1000)}`,
                ddi: '55',
                companyNome: `Empresa ${random}`,
                companyCnpj: '12.345.678/0001-00',
                companyTelefone: '(11) 98888-8888',
                companyDdi: '55'
              }));
            }}
          >
            Preencher dados aleatórios (Teste)
          </Button>
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
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
                      autoComplete="given-name"
                  />
                  {!isBusiness && (
                      <Input
                      label="Sobrenome"
                      name="sobreNome"
                      value={formData.sobreNome}
                      onChange={handleChange}
                      required
                      placeholder="Sobrenome"
                      autoComplete="family-name"
                      />
                  )}
              </div>

              <div className="space-y-4">
                  <Input
                      label="CPF"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleChange}
                      required
                      placeholder="000.000.000-00"
                      maxLength={14}
                      autoComplete="off"
                  />
                  <PhoneInput
                      label={isBusiness ? "Telefone Pessoal" : "Seu Telefone"}
                      ddi={formData.ddi}
                      onDdiChange={(val) => handleDdiChange('ddi', val)}
                      phoneNumber={formData.telefone}
                      onPhoneChange={(val) => handlePhoneChange('telefone', val)}
                      error={error?.includes('Telefone') ? error : undefined}
                  />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-20 h-20 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center shrink-0">
                      {formData.fotoPerfilUrl ? (
                          <img src={formData.fotoPerfilUrl} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                          <div className="text-gray-300">
                              <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                          </div>
                      )}
                  </div>
                  <div className="flex-1 space-y-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase">
                          Foto de Perfil (Opcional)
                      </label>
                      <input
                          type="file"
                          name="fotoPerfil"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800"
                      />
                  </div>
              </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h4 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
                Dados de Acesso
            </h4>
            <Input
                label="Email (Login)"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="seu@email.com"
                disabled={isEmailLocked} // Bloqueia se vier do convite
                className={isEmailLocked ? 'bg-gray-50 text-gray-500' : ''}
                autoComplete="email"
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
                autoComplete="new-password"
            />

            <Input
                label="Confirmar Senha"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="******"
                minLength={6}
                autoComplete="new-password"
            />
          </div>
        )}

        {step === 3 && isBusiness && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <h4 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2">
                    Dados da Empresa/Estabelecimento
                </h4>
                
                <Input
                    label="Razão Social / Nome da Empresa/Estabelecimento"
                    name="companyNome"
                    value={formData.companyNome}
                    onChange={handleChange}
                    required={isBusiness}
                    placeholder="Minha Loja LTDA"
                    autoComplete="organization"
                />

                <div className="space-y-4">
                    <Input
                        label="CPF/CNPJ"
                        name="companyCnpj"
                        value={formData.companyCnpj}
                        onChange={handleChange}
                        required={isBusiness}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        maxLength={18}
                        autoComplete="off"
                    />
                    <PhoneInput
                        label="Telefone Comercial"
                        ddi={formData.companyDdi}
                        onDdiChange={(val) => handleDdiChange('companyDdi', val)}
                        phoneNumber={formData.companyTelefone}
                        onPhoneChange={(val) => handlePhoneChange('companyTelefone', val)}
                        error={error?.includes('Telefone Comercial') ? error : undefined}
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-20 h-20 rounded-full border-2 border-white shadow-sm overflow-hidden bg-white flex items-center justify-center shrink-0">
                        {formData.companyLogoUrl ? (
                            <img src={formData.companyLogoUrl} alt="Logo Preview" className="w-full h-full object-contain p-2" />
                        ) : (
                            <div className="text-gray-300">
                                <Store className="w-10 h-10" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase">
                            Logo da Empresa/Estabelecimento
                        </label>
                        <input
                            type="file"
                            name="companyLogo"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        />
                        <p className="text-[10px] text-gray-400">Recomendado: PNG ou SVG com fundo transparente.</p>
                    </div>
                </div>
            </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handleBack} className="flex-1">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          <Button type="submit" className="flex-[2]" isLoading={isLoading} variant={isBusiness ? 'secondary' : 'primary'}>
            {step === totalSteps ? (isBusiness ? 'Finalizar Cadastro' : 'Criar Conta') : (
              <>
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
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
