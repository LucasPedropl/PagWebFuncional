import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../context/ToastContext';
import {
  AdminUpgradeMode,
  AdminUpgradePjFormSchema,
  AdminUpgradePjFormValues,
} from '../schemas/adminUpgradeSchemas';
import { submitAdminUpgrade } from '../services/adminUpgradeService';

const emptyPjForm = (): AdminUpgradePjFormValues => ({
  nome: '',
  cnpj: '',
  telefone: '',
});

export function useAdminUpgrade() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [mode, setMode] = useState<AdminUpgradeMode | null>(null);
  const [pjForm, setPjForm] = useState<AdminUpgradePjFormValues>(emptyPjForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [requestPayment, setRequestPayment] = useState(true);
  const [requestWhatsapp, setRequestWhatsapp] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePjField = <K extends keyof AdminUpgradePjFormValues>(
    field: K,
    value: AdminUpgradePjFormValues[K],
  ) => {
    setPjForm((prev) => ({ ...prev, [field]: value }));
  };

  const submit = async () => {
    if (!mode) {
      setError('Escolha Empresa (PJ) ou Pessoal (PF).');
      return;
    }

    if (mode === 'pj') {
      const parsed = AdminUpgradePjFormSchema.safeParse(pjForm);
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? 'Dados da empresa inválidos');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitAdminUpgrade({
        mode,
        password,
        requestPayment,
        requestWhatsapp,
        pjForm: mode === 'pj' ? pjForm : undefined,
        logoFile,
      });

      if (result.wantsModules) {
        const modulos = [
          ...(requestPayment ? ['payment'] : []),
          ...(requestWhatsapp ? ['whatsapp'] : []),
        ].join(',');
        addToast(
          'success',
          'Estabelecimento criado',
          'Painel admin liberado. Falta concluir a solicitação dos módulos em Integrações com o código de verificação enviado por e-mail.',
        );
        navigate(`/business/configuracoes?tab=integracoes&modulos=${modulos}`);
      } else {
        addToast(
          'success',
          'Estabelecimento criado',
          'Você já pode usar o painel administrativo.',
        );
        navigate('/business/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao criar estabelecimento';
      console.error('[admin-upgrade]', err);
      setError(message);
      addToast('error', 'Não foi possível concluir', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    mode,
    setMode,
    pjForm,
    updatePjField,
    logoFile,
    setLogoFile,
    requestPayment,
    setRequestPayment,
    requestWhatsapp,
    setRequestWhatsapp,
    password,
    setPassword,
    isSubmitting,
    error,
    submit,
  };
}
