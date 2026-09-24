import React from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Mail, Send } from 'lucide-react';
import { AuthStepIndicator } from '../../../components/features/auth/AuthStepIndicator';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { PhoneInput } from '../../../components/ui/PhoneInput';
import { getAuthTheme } from '../../../utils/authTheme';
import {
  CONNECT_CLIENT_STEPS,
  useConnectClientWizard,
} from '../hooks/useConnectClientWizard';

interface ConnectClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent: (email: string) => void;
  onInviteError: (message: string) => void;
}

export const ConnectClientModal: React.FC<ConnectClientModalProps> = ({
  isOpen,
  onClose,
  onInviteSent,
  onInviteError,
}) => {
  const theme = getAuthTheme('business');
  const {
    step,
    formData,
    fieldError,
    isSaving,
    successEmail,
    handleTextChange,
    handlePhoneChange,
    handleDdiChange,
    goNext,
    goBack,
    submitInvite,
  } = useConnectClientWizard({
    isOpen,
    onSuccess: onInviteSent,
    onError: onInviteError,
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (successEmail) return;
    if (step === 1) goNext();
    else void submitInvite();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={successEmail ? 'Convite Enviado' : 'Conectar Novo Cliente'}
      size="lg"
      onSubmit={!successEmail ? handleFormSubmit : undefined}
      footer={
        successEmail ? (
          <Button onClick={onClose} className="w-full bg-slate-900 hover:bg-slate-800">
            Entendido
          </Button>
        ) : (
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={step === 1 ? onClose : goBack}
              disabled={isSaving}
            >
              {step === 1 ? (
                'Cancelar'
              ) : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Voltar
                </>
              )}
            </Button>
            {step === 1 ? (
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800">
                Continuar
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="submit"
                isLoading={isSaving}
                className="bg-slate-900 hover:bg-slate-800"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Convite
              </Button>
            )}
          </div>
        )
      }
    >
      {successEmail ? (
        <div className="text-center py-4 animate-fadeIn">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Solicitação enviada!</h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Um convite foi enviado para <strong className="text-gray-900">{successEmail}</strong>.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-left border border-gray-100">
            <p className="text-gray-600 flex gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
              <span>
                Se o cliente já possuir conta, ele receberá uma notificação para aceitar. Caso
                contrário, ele será instruído a criar uma conta gratuita para se conectar à sua
                empresa.
              </span>
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <AuthStepIndicator
            steps={[...CONNECT_CLIENT_STEPS]}
            currentStep={step}
            theme={theme}
          />

          {fieldError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {fieldError}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Informações pessoais</h4>
                <p className="text-xs text-slate-500 mt-1">Usados para identificação e contato.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleTextChange}
                  required
                  placeholder="Nome"
                  autoComplete="given-name"
                  autoFocus
                />
                <Input
                  label="Sobrenome"
                  name="sobreNome"
                  value={formData.sobreNome}
                  onChange={handleTextChange}
                  required
                  placeholder="Sobrenome"
                  autoComplete="family-name"
                />
              </div>

              <Input
                label="CPF"
                name="cpf"
                value={formData.cpf}
                onChange={handleTextChange}
                required
                placeholder="000.000.000-00"
                maxLength={14}
                autoComplete="off"
              />
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-3 duration-300">
              <Input
                label="E-mail do cliente"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleTextChange}
                required
                placeholder="cliente@exemplo.com"
                autoComplete="email"
                autoFocus
              />

              <PhoneInput
                label="Telefone"
                ddi={formData.ddi}
                onDdiChange={handleDdiChange}
                phoneNumber={formData.telefone}
                onPhoneChange={handlePhoneChange}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
