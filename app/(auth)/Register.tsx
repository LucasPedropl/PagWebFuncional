import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { userService } from '../../services/userService';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { Button } from '../../components/ui/Button';
import { AuthAlert } from '../../components/features/auth/AuthAlert';
import { AuthStepIndicator } from '../../components/features/auth/AuthStepIndicator';
import { RegisterStepPersonal } from '../../components/features/auth/register/RegisterStepPersonal';
import { RegisterStepAccess } from '../../components/features/auth/register/RegisterStepAccess';
import { RegisterStepCompany } from '../../components/features/auth/register/RegisterStepCompany';
import { RegisterStepAddress } from '../../components/features/auth/register/RegisterStepAddress';
import { RegisterFormData } from '../../components/features/auth/register/registerTypes';
import { formatCPF, formatPhone, formatCPFOrCNPJ } from '../../utils/formatters';
import { getAuthTheme, AuthAudience } from '../../utils/authTheme';
import { emptyEndereco, EnderecoInputSchema } from '../../features/address/schemas/enderecoSchemas';

const emptyForm = (): RegisterFormData => ({
  nome: '',
  sobreNome: '',
  cpf: '',
  email: '',
  password: '',
  confirmPassword: '',
  telefone: '',
  fotoPerfil: null,
  companyNome: '',
  companyCnpj: '',
  companyTelefone: '',
  companyLogo: null,
  fotoPerfilUrl: '',
  companyLogoUrl: '',
  ddi: '55',
  companyDdi: '55',
  endereco: emptyEndereco(),
});

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const rawType = searchParams.get('type');
  const type = rawType?.split('?')[0] as 'client' | 'business' | null;
  const isBusiness = type === 'business';
  const audience: AuthAudience = isBusiness ? 'business' : 'client';
  const theme = getAuthTheme(audience);

  const [inviteCompanyId, setInviteCompanyId] = useState<number | null>(null);
  const [isEmailLocked, setIsEmailLocked] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>(emptyForm);

  const stepDefs = useMemo(() => {
    if (isBusiness) {
      return [
        { id: 1, label: 'Administrador' },
        { id: 2, label: 'Acesso' },
        { id: 3, label: 'Empresa' },
        { id: 4, label: 'Endereço' },
      ];
    }
    return [
      { id: 1, label: 'Perfil' },
      { id: 2, label: 'Acesso' },
      { id: 3, label: 'Endereço' },
    ];
  }, [isBusiness]);

  const totalSteps = stepDefs.length;

  useEffect(() => {
    let emailFromUrl = searchParams.get('email');
    let idFromUrl = searchParams.get('Id');
    if (!emailFromUrl || !idFromUrl) {
      const href = window.location.href;
      const emailMatch = href.match(/[?&]email=([^&]+)/);
      if (emailMatch) emailFromUrl = decodeURIComponent(emailMatch[1]);
      const idMatch = href.match(/[?&]Id=(\d+)/);
      if (idMatch) idFromUrl = idMatch[1];
    }
    if (emailFromUrl) {
      setFormData((prev) => ({ ...prev, email: emailFromUrl as string }));
      setIsEmailLocked(true);
    }
    if (idFromUrl) setInviteCompanyId(parseInt(idFromUrl, 10));
  }, [searchParams]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setFormData((prev) => ({ ...prev, [name]: file }));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    if (name === 'fotoPerfil') {
      setFormData((prev) => ({ ...prev, fotoPerfil: file, fotoPerfilUrl: previewUrl }));
    } else if (name === 'companyLogo') {
      setFormData((prev) => ({ ...prev, companyLogo: file, companyLogoUrl: previewUrl }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    const name = e.target.name;
    if (name === 'cpf') value = formatCPF(value);
    if (name === 'companyCnpj') value = formatCPFOrCNPJ(value);
    if (name === 'telefone' || name === 'companyTelefone') value = formatPhone(value);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const stepProps = {
    formData,
    audience,
    isEmailLocked,
    onChange: handleChange,
    onFileChange: handleFileChange,
    onPhoneChange: (name: 'telefone' | 'companyTelefone', value: string) =>
      setFormData((prev) => ({ ...prev, [name]: formatPhone(value) })),
    onDdiChange: (name: 'ddi' | 'companyDdi', value: string) =>
      setFormData((prev) => ({ ...prev, [name]: value })),
    onEnderecoChange: (endereco: RegisterFormData['endereco']) =>
      setFormData((prev) => ({ ...prev, endereco })),
  };

  const isAddressStep = isBusiness ? step === 4 : step === 3;

  const validateStep = (): boolean => {
    setError(null);
    if (step === 1) {
      if (!formData.nome || (!isBusiness && !formData.sobreNome) || !formData.cpf || !formData.telefone) {
        setError('Preencha todos os campos obrigatórios.');
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
        setError('Preencha todos os campos de acesso.');
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
    } else if (step === 3 && isBusiness) {
      if (!formData.companyNome || !formData.companyCnpj || !formData.companyTelefone) {
        setError('Preencha os dados da empresa.');
        return false;
      }
    } else if (isAddressStep) {
      const parsed = EnderecoInputSchema.safeParse(formData.endereco);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Preencha o endereço completo.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;
    if (step < totalSteps) {
      setStep((prev) => prev + 1);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const cleanCPF = formData.cpf.replace(/\D/g, '');
      const cleanPhone = formData.telefone.replace(/\D/g, '');
      const cleanCNPJ = formData.companyCnpj.replace(/\D/g, '');
      const cleanCompPhone = formData.companyTelefone.replace(/\D/g, '');

      await userService.register(
        {
          nome: formData.nome,
          sobreNome: isBusiness ? 'Admin' : formData.sobreNome,
          cpf: cleanCPF,
          email: formData.email,
          password: formData.password,
          telefone: formData.ddi + cleanPhone,
          fotoPerfil: formData.fotoPerfil,
        },
        inviteCompanyId ?? undefined
      );

      if (inviteCompanyId) {
        await userService.login(formData.email, formData.password);
        try {
          const { enderecoService } = await import('../../features/address/services/enderecoService');
          await enderecoService.createForUser(formData.endereco);
        } catch (addrErr) {
          console.error('[Register] Endereço pós-convite:', addrErr);
        }
        navigate('/dashboard');
        return;
      }

      navigate('/activate', {
        state: {
          email: formData.email,
          password: formData.password,
          isBusinessRegistration: isBusiness,
          endereco: formData.endereco,
          companyData: isBusiness
            ? {
                nome: formData.companyNome,
                cnpj: cleanCNPJ,
                telefone: formData.companyDdi + cleanCompPhone,
                logo: formData.companyLogo,
              }
            : null,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Cpf')) setError('Este CPF já está cadastrado.');
      else if (msg.includes('Email')) setError('Este e-mail já está em uso.');
      else setError(msg || 'Erro ao registrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillRandomTestData = () => {
    const random = Math.floor(Math.random() * 10000);
    const randomCPF = `${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}.${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}`;
    sessionStorage.setItem('isRandomTest', 'true');
    setFormData((prev) => ({
      ...prev,
      nome: `Teste ${random}`,
      sobreNome: `User ${random}`,
      cpf: randomCPF,
      email: isEmailLocked ? prev.email : `teste${random}@example.com`,
      password: '123123',
      confirmPassword: '123123',
      telefone: `(11) 9${Math.floor(Math.random() * 8999 + 1000)}-${Math.floor(Math.random() * 8999 + 1000)}`,
      companyNome: `Empresa ${random}`,
      companyCnpj: '12.345.678/0001-95',
      companyTelefone: `(11) 3${Math.floor(Math.random() * 8999 + 1000)}-${Math.floor(Math.random() * 8999 + 1000)}`,
      endereco: {
        rua: 'Rua Teste',
        numero: String(100 + (random % 80)),
        bairro: 'Centro',
        cidade: 'Sao Paulo',
        estado: 'SP',
        cep: '01001000',
      },
    }));
  };

  const footer = (
    <div className="text-center space-y-3">
      <p className="text-sm text-slate-600">
        Já tem conta?{' '}
        <Link
          to={`/login${type ? `?type=${type}` : ''}`}
          className={`font-semibold hover:underline ${theme.linkClass}`}
        >
          Fazer login
        </Link>
      </p>
      <Link to="/" className="text-xs text-slate-400 hover:text-slate-600">
        Voltar ao início
      </Link>
    </div>
  );

  return (
    <AuthLayout
      audience={audience}
      wide
      title={isBusiness ? 'Cadastre seu estabelecimento' : 'Crie sua conta'}
      subtitle={
        inviteCompanyId
          ? 'Complete o cadastro para se vincular à empresa convidante.'
          : isBusiness
            ? 'Em poucos passos você ativa o painel administrativo.'
            : 'Comece a explorar planos e gerenciar suas assinaturas.'
      }
      footer={footer}
    >
      <AuthStepIndicator steps={stepDefs} currentStep={step} theme={theme} />

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} autoComplete="off">
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={fillRandomTestData}
            className="w-full text-[11px] py-2 rounded-[5px] border border-dashed border-amber-200 text-amber-800 bg-amber-50/80 hover:bg-amber-100 flex items-center justify-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Preencher dados de teste (dev)
          </button>
        )}

        {step === 1 && <RegisterStepPersonal {...stepProps} />}
        {step === 2 && <RegisterStepAccess {...stepProps} />}
        {step === 3 && isBusiness && <RegisterStepCompany {...stepProps} />}
        {isAddressStep && (
          <RegisterStepAddress
            formData={formData}
            onEnderecoChange={stepProps.onEnderecoChange}
            isBusiness={isBusiness}
          />
        )}

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        <div className="flex gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep((s) => s - 1);
                setError(null);
              }}
              className="flex-1 h-11 rounded-[5px]"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isLoading}
            className={`${step > 1 ? 'flex-[2]' : 'w-full'} h-11 rounded-[5px] text-white border-0 ${theme.buttonClass}`}
          >
            {step === totalSteps ? (isBusiness ? 'Finalizar cadastro' : 'Criar conta') : (
              <>
                Continuar
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
