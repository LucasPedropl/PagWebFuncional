import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { businessService } from '../../../services/businessService';
import type { User } from '../../../types';
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
  existingClients?: User[];
}

/**
 * Wizard de “Cadastrar Cliente”. Coleta nome/CPF/telefone/e-mail e submete
 * com senha sentinela acordada com o backend para clientes pagadores sem conta.
 */
export function useConnectClientWizard({
  isOpen,
  onSuccess,
  onError,
  existingClients,
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
      if (!formData.nome || !formData.sobreNome || !formData.cpf) {
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

      // Validação preventiva: cliente com mesmo CPF já cadastrado na empresa
      if (existingClients && existingClients.length > 0) {
        const cleanFormCpf = formData.cpf.replace(/\D/g, '');
        const duplicateClient = existingClients.find(
          (c) => c.cpf && c.cpf.replace(/\D/g, '') === cleanFormCpf
        );
        if (duplicateClient) {
          const clientName = [duplicateClient.nome, duplicateClient.sobreNome].filter(Boolean).join(' ');
          setFieldError(
            `Este CPF já pertence ao cliente ${clientName || 'cadastrado'} na sua empresa. Não é necessário recadastrá-lo.`
          );
          return false;
        }
      }

      return true;
    }

    if (!formData.email.trim() || !formData.telefone) {
      setFieldError('Preencha e-mail e telefone.');
      return false;
    }
    if (!isValidEmail(formData.email)) {
      setFieldError('E-mail inválido.');
      return false;
    }
    if (!isValidPhone(formData.telefone, formData.ddi)) {
      setFieldError('Telefone inválido.');
      return false;
    }

    // Validação preventiva: cliente com mesmo e-mail já cadastrado na empresa
    if (existingClients && existingClients.length > 0) {
      const cleanFormEmail = formData.email.trim().toLowerCase();
      const duplicateClient = existingClients.find(
        (c) => c.email && c.email.trim().toLowerCase() === cleanFormEmail
      );
      if (duplicateClient) {
        const clientName = [duplicateClient.nome, duplicateClient.sobreNome].filter(Boolean).join(' ');
        setFieldError(
          `O e-mail informado já pertence ao cliente ${clientName || 'cadastrado'} na sua empresa.`
        );
        return false;
      }
    }

    return true;
  }, [existingClients, formData, step]);

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
      await businessService.registerClient({
        nome: formData.nome,
        sobreNome: formData.sobreNome,
        cpf: formData.cpf,
        telefone: formData.telefone,
        email,
      });
      setSuccessEmail(email);
      onSuccess(email);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      if (message.includes('sucesso') || message.includes('convidado') || message.includes('vinculado')) {
        setSuccessEmail(email);
        onSuccess(email);
      } else {
        setFieldError(message);
        onError(message);
      }
    } finally {
      setIsSaving(false);
    }
  }, [formData, onError, onSuccess, validateStep]);

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
