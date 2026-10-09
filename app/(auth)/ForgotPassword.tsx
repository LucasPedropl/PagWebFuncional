import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { AuthInput } from '../../components/features/auth/AuthInput';
import { AuthAlert } from '../../components/features/auth/AuthAlert';
import { Button } from '../../components/ui/Button';
import { getAuthTheme } from '../../utils/authTheme';
import { userService } from '../../services/userService';
import { LoginAudience } from '../../features/auth/services/rememberedLoginCredentialsService';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const rawType = searchParams.get('type');
  const isBusiness = rawType === 'business';
  const audience: LoginAudience = isBusiness ? 'business' : 'client';
  const theme = getAuthTheme(audience);

  // Modo: 'request' (enviar e-mail) ou 'reset' (inserir código e nova senha)
  const [mode, setMode] = useState<'request' | 'reset'>('request');

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    const urlToken = searchParams.get('token');
    if (urlEmail) setEmail(urlEmail);
    if (urlToken) {
      setToken(urlToken.trim());
      setMode('reset');
    }
  }, [searchParams]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);
      const res = await userService.requestPasswordReset(email.trim());
      setSuccessMessage(res.message || 'Código de recuperação enviado para o seu e-mail.');
      setMode('reset');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Falha ao solicitar código de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Por favor, informe o e-mail cadastrado.');
      return;
    }
    if (!token.trim()) {
      setError('Por favor, informe o código de verificação recebido.');
      return;
    }
    if (newPassword.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasDigit = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasDigit) {
      setError('A senha deve conter pelo menos uma letra e um número.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await userService.resetPassword({
        email: email.trim(),
        token: token.trim(),
        novaSenha: newPassword,
      });
      setIsCompleted(true);
      setSuccessMessage(res.message || 'Senha redefinida com sucesso!');
      setTimeout(() => {
        navigate(`/login?type=${audience}&email=${encodeURIComponent(email.trim())}`);
      }, 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Código inválido ou expirado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      audience={audience}
      title={
        isCompleted
          ? 'Senha Alterada!'
          : mode === 'request'
          ? 'Recuperar Senha'
          : 'Redefinir Senha'
      }
      subtitle={
        isCompleted
          ? 'Você já pode acessar sua conta com a nova senha.'
          : mode === 'request'
          ? 'Informe seu e-mail para receber as instruções de recuperação.'
          : 'Digite o código recebido no e-mail e escolha sua nova senha.'
      }
      footer={
        <div className="text-center text-xs text-slate-500">
          Lembrou sua senha?{' '}
          <Link
            to={`/login?type=${audience}`}
            className="font-semibold text-slate-900 hover:underline"
          >
            Fazer login
          </Link>
        </div>
      }
    >
      {isCompleted ? (
        <div className="space-y-6 py-4 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Sucesso!</h3>
            <p className="text-sm text-slate-600">
              Sua senha foi redefinida com segurança. Redirecionando para o login em instantes...
            </p>
          </div>
          <Button
            type="button"
            onClick={() => navigate(`/login?type=${audience}`)}
            className={`w-full h-11 text-white font-semibold rounded-[5px] border-0 ${theme.buttonClass}`}
          >
            Ir para o Login
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      ) : mode === 'request' ? (
        <form className="space-y-5" onSubmit={handleRequestReset}>
          {error && <AuthAlert variant="error">{error}</AuthAlert>}
          {successMessage && <AuthAlert variant="info">{successMessage}</AuthAlert>}

          <AuthInput
            label="E-mail cadastrado"
            name="email"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={isBusiness ? 'admin@empresa.com' : 'voce@email.com'}
            autoComplete="email"
          />

          <Button
            type="submit"
            className={`w-full h-12 rounded-[5px] text-white font-semibold border-0 ${theme.buttonClass}`}
            isLoading={isLoading}
          >
            Enviar código de recuperação
            {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('reset');
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              Já possuo um código de recuperação →
            </button>
          </div>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleConfirmReset}>
          {error && <AuthAlert variant="error">{error}</AuthAlert>}
          {successMessage && <AuthAlert variant="info">{successMessage}</AuthAlert>}

          <AuthInput
            label="E-mail"
            name="email"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Seu e-mail cadastrado"
          />

          <AuthInput
            label="Código de Verificação"
            name="token"
            type="text"
            icon={KeyRound}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            placeholder="Cole o código recebido por e-mail"
          />

          <AuthInput
            label="Nova Senha"
            name="newPassword"
            type="password"
            icon={Lock}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Mínimo 8 caracteres"
          />

          <AuthInput
            label="Confirmar Nova Senha"
            name="confirmPassword"
            type="password"
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Repita a nova senha"
          />

          <Button
            type="submit"
            className={`w-full h-12 rounded-[5px] text-white font-semibold border-0 ${theme.buttonClass} mt-2`}
            isLoading={isLoading}
          >
            Redefinir Minha Senha
            {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode('request');
              }}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Solicitar novo código
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
