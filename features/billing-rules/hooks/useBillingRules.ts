import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BillingRules,
  BillingRulesSchema,
  DEFAULT_BILLING_RULES,
  ReguaCobranca,
} from '../schemas/billingRulesSchemas';
import { billingRulesService } from '../services/billingRulesService';
import { useToast } from '../../../context/ToastContext';

export interface BillingRulesFormState {
  taxaPadraoPercent: string;
  multaAtrasoPercent: string;
  jurosAtrasoMesPercent: string;
  reguaCobranca: ReguaCobranca;
  templateEmail: string;
  templateWhatsapp: string;
}

export interface BillingRulesFormErrors {
  taxaPadraoPercent?: string;
  multaAtrasoPercent?: string;
  jurosAtrasoMesPercent?: string;
  templateEmail?: string;
  templateWhatsapp?: string;
}

const parsePtBrNumber = (val: string): number => {
  if (!val || val.trim() === '') return NaN;
  const normalized = val.trim().replace(',', '.');
  return Number(normalized);
};

const formatNumberToPtBr = (num: number): string => {
  if (!Number.isFinite(num)) return '0';
  return String(num).replace('.', ',');
};

const rulesToFormState = (rules: BillingRules): BillingRulesFormState => ({
  taxaPadraoPercent: formatNumberToPtBr(rules.taxaPadraoPercent),
  multaAtrasoPercent: formatNumberToPtBr(rules.multaAtrasoPercent),
  jurosAtrasoMesPercent: formatNumberToPtBr(rules.jurosAtrasoMesPercent),
  reguaCobranca: { ...rules.reguaCobranca },
  templateEmail: rules.templateEmail ?? '',
  templateWhatsapp: rules.templateWhatsapp ?? '',
});

export const useBillingRules = (idEmpresa: number | null) => {
  const { addToast } = useToast();
  const [formState, setFormState] = useState<BillingRulesFormState>(() =>
    rulesToFormState(DEFAULT_BILLING_RULES),
  );
  const [initialRules, setInitialRules] = useState<BillingRules>(DEFAULT_BILLING_RULES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchRules = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await billingRulesService.getRules(idEmpresa);
      setInitialRules(data);
      setFormState(rulesToFormState(data));
    } catch {
      addToast('error', 'Erro', 'Falha ao carregar regras de cobrança');
    } finally {
      setIsLoading(false);
    }
  }, [idEmpresa, addToast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const parsedRulesObj = useMemo<BillingRules>(() => {
    return {
      taxaPadraoPercent: parsePtBrNumber(formState.taxaPadraoPercent),
      multaAtrasoPercent: parsePtBrNumber(formState.multaAtrasoPercent),
      jurosAtrasoMesPercent: parsePtBrNumber(formState.jurosAtrasoMesPercent),
      reguaCobranca: formState.reguaCobranca,
      templateEmail: formState.templateEmail,
      templateWhatsapp: formState.templateWhatsapp,
    };
  }, [formState]);

  const validationResult = useMemo(() => {
    return BillingRulesSchema.safeParse(parsedRulesObj);
  }, [parsedRulesObj]);

  const errors = useMemo<BillingRulesFormErrors>(() => {
    if (validationResult.success) return {};
    const fieldErrors: BillingRulesFormErrors = {};
    for (const issue of validationResult.error.issues) {
      const field = issue.path[0] as keyof BillingRulesFormErrors;
      if (field && !fieldErrors[field]) {
        fieldErrors[field] = issue.message;
      }
    }
    return fieldErrors;
  }, [validationResult]);

  const isValid = validationResult.success;

  const isDirty = useMemo(() => {
    if (!isValid) return true;
    const current = validationResult.data;
    return (
      current.taxaPadraoPercent !== initialRules.taxaPadraoPercent ||
      current.multaAtrasoPercent !== initialRules.multaAtrasoPercent ||
      current.jurosAtrasoMesPercent !== initialRules.jurosAtrasoMesPercent ||
      current.templateEmail !== initialRules.templateEmail ||
      current.templateWhatsapp !== initialRules.templateWhatsapp ||
      current.reguaCobranca.cincoDiasAntes !== initialRules.reguaCobranca.cincoDiasAntes ||
      current.reguaCobranca.doisDiasAntes !== initialRules.reguaCobranca.doisDiasAntes ||
      current.reguaCobranca.noVencimento !== initialRules.reguaCobranca.noVencimento ||
      current.reguaCobranca.aposVencimento !== initialRules.reguaCobranca.aposVencimento
    );
  }, [isValid, validationResult, initialRules]);

  const setFieldValue = useCallback(
    <K extends keyof BillingRulesFormState>(field: K, value: BillingRulesFormState[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const toggleReguaItem = useCallback((key: keyof ReguaCobranca) => {
    setFormState((prev) => ({
      ...prev,
      reguaCobranca: {
        ...prev.reguaCobranca,
        [key]: !prev.reguaCobranca[key],
      },
    }));
  }, []);

  const handleSave = async () => {
    if (!validationResult.success) {
      addToast('error', 'Erro', 'Por favor, corrija os erros do formulário antes de salvar.');
      return;
    }
    setIsSaving(true);
    try {
      const saved = await billingRulesService.saveRules(idEmpresa, validationResult.data);
      setInitialRules(saved);
      setFormState(rulesToFormState(saved));
      addToast('success', 'Sucesso', 'Regras de cobrança salvas com sucesso!');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Falha ao salvar regras de cobrança';
      addToast('error', 'Erro', message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = useCallback(() => {
    setFormState(rulesToFormState(DEFAULT_BILLING_RULES));
    addToast('success', 'Padrões restaurados', 'Os valores padrão foram aplicados no formulário. Clique em Salvar para confirmar.');
  }, [addToast]);

  return {
    formState,
    errors,
    isValid,
    isDirty,
    isLoading,
    isSaving,
    parsedRules: validationResult.success ? validationResult.data : DEFAULT_BILLING_RULES,
    setFieldValue,
    toggleReguaItem,
    handleSave,
    handleResetToDefault,
  };
};
