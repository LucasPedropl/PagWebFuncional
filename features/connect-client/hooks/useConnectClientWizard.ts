import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { businessService } from '../../../services/businessService';
import { formatCPF, formatPhone } from '../../../utils/formatters';
import {
  isValidCPF,
  isValidEmail,
  isValidName,
  isValidPhone,
} from '../../../utils/validators';

export type ConnectClientWizardStep = 1 | 2;

export interface ConnectClientFormData {
  nome: string;
  sobreNome: string;
  cpf: string;
  telefone: string;
  ddi: string;
  email: string;
}

const emptyForm = (): ConnectClientFormData => ({
  nome: '',
  sobreNome: '',
  cpf: '',
  telefone: '',
  ddi: '55',
  email: '',
});

export const CONNECT_CLIENT_STEPS = [
  { id: 1, label: 'Perfil' },
  { id: 2, label: 'Contato' },
] as const;

interface UseConnectClientWizardParams {
  isOpen: boolean;
  onSuccess: (email: string) => void;
  onError: (message: string) => void;
}

/**
 * Wizard de “Conectar Cliente”. Coleta nome/CPF/telefone/e-mail como no cadastro,
 * mas a API atual só aceita e-mail — só isso é enviado em connectClient.
 */
export function useConnectClientWizard({
  isOpen,
  onSuccess,
  onError,
}: UseConnectClientWizardParams) {
  const [step, setStep] = useState<ConnectClientWizardStep>(1);
  const [formData, setFormData] = useState<ConnectClientFormData>(emptyForm);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData(emptyForm());
      setFieldError(null);
      setIsSaving(false);
      setSuccessEmail(null);
    }
  }, [isOpen]);

  const handleTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let value = e.target.value;
    if (name === 'cpf') value = formatCPF(value);
    if (name === 'telefone') value = formatPhone(value);
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handlePhoneChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, telefone: formatPhone(value) }));
  }, []);

  const handleDdiChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, ddi: value }));
  }, []);

  const validateStep = useCallback((): boolean => {
    setFieldError(null);

    if (step === 1) {
      if (!formData.nome || !formData.sobreNome || !formData.cpf || !formData.telefone) {
        setFieldError('Preencha todos os campos obrigatórios.');
        return false;
      }
      if (!isValidName(formData.nome)) {
        setFieldError('Nome inválido (mínimo 2 letras, sem números ou símbolos).');
        return false;
      }
      if (!isValidName(formData.sobreNome)) {
        setFieldError('Sobrenome inválido (mínimo 2 letras, sem números ou símbolos).');
        return false;
      }
      if (!isValidCPF(formData.cpf)) {
        setFieldError('CPF inválido.');
        return false;
      }
      if (!isValidPhone(formData.telefone, formData.ddi)) {
        setFieldError('Telefone inválido.');
        return false;
      }
      return true;
    }

    if (!formData.email.trim()) {
      setFieldError('Informe o e-mail do cliente.');
      return false;
    }
    if (!isValidEmail(formData.email)) {
      setFieldError('E-mail inválido.');
      return false;
    }
    return true;
  }, [formData, step]);

  const goNext = useCallback(() => {
    if (!validateStep()) return;
    if (step < 2) setStep(2);
  }, [step, validateStep]);

  const goBack = useCallback(() => {
    setFieldError(null);
    if (step > 1) setStep(1);
  }, [step]);

  const submitInvite = useCallback(async () => {
    if (!validateStep()) return;

    const email = formData.email.trim();
    try {
      setIsSaving(true);
      // Backend ainda não recebe nome/CPF/telefone — só e-mail, como antes.
      await businessService.connectClient(email);
      setSuccessEmail(email);
      onSuccess(email);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      if (message.includes('sucesso') || message.includes('convidado')) {
        setSuccessEmail(email);
        onSuccess(email);
      } else {
        onError(message);
      }
    } finally {
      setIsSaving(false);
    }
  }, [formData.email, onError, onSuccess, validateStep]);

  return {
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
  };
}
