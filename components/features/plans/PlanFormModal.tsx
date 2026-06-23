import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { AuthStepIndicator } from '../auth/AuthStepIndicator';
import { AuthAlert } from '../auth/AuthAlert';
import { getAuthTheme } from '../../../utils/authTheme';
import { PlanResponse } from '../../../types';
import { PlanServiceBenefit } from '../../../features/services/schemas/serviceTypes';
import { LocalService } from '../../../features/services/schemas/serviceTypes';
import {
  PLAN_FORM_STEPS,
  PlanFormData,
} from './planFormTypes';
import { PlanFormStepBasic } from './PlanFormStepBasic';
import { PlanFormStepContract } from './PlanFormStepContract';
import { PlanFormStepContent } from './PlanFormStepContent';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSaving: boolean;
  selectedPlan: PlanResponse | null;
  formData: PlanFormData;
  planBenefits: PlanServiceBenefit[];
  catalogServices: LocalService[];
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBenefitsChange: (benefits: PlanServiceBenefit[]) => void;
  onSave: () => void;
}

export const PlanFormModal: React.FC<PlanFormModalProps> = ({
  isOpen,
  onClose,
  isSaving,
  selectedPlan,
  formData,
  planBenefits,
  catalogServices,
  onInputChange,
  onFileChange,
  onBenefitsChange,
  onSave,
}) => {
  const theme = getAuthTheme('business');
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const totalSteps = PLAN_FORM_STEPS.length;
  const isLastStep = step === totalSteps;

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
    }
  }, [isOpen, selectedPlan?.idPlano]);

  const validateStep = (): boolean => {
    setError(null);
    if (step === 1) {
      if (!formData.nome.trim()) {
        setError('Informe o nome do plano.');
        return false;
      }
      if (!formData.valorMensalidade || Number(formData.valorMensalidade.replace(',', '.')) < 0) {
        setError('Informe um preço mensal válido.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    if (!isLastStep) {
      setStep((s) => s + 1);
      return;
    }
    onSave();
  };

  const handleClose = () => {
    setStep(1);
    setError(null);
    onClose();
  };

  const stepProps = { formData, onInputChange, onFileChange };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedPlan ? 'Editar Plano' : 'Novo Plano'}
      size="lg"
      onSubmit={handleSubmit}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep((s) => s - 1);
                  setError(null);
                }}
                disabled={isSaving}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            )}
            <Button
              type="submit"
              isLoading={isSaving}
              className="bg-slate-900 hover:bg-slate-800 min-w-[8.5rem]"
            >
              {isLastStep ? (
                selectedPlan ? 'Salvar alterações' : 'Criar plano'
              ) : (
                <>
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <AuthStepIndicator
        steps={[...PLAN_FORM_STEPS]}
        currentStep={step}
        theme={theme}
      />

      {step === 1 && <PlanFormStepBasic {...stepProps} />}
      {step === 2 && <PlanFormStepContract {...stepProps} />}
      {step === 3 && (
        <PlanFormStepContent
          {...stepProps}
          planBenefits={planBenefits}
          onBenefitsChange={onBenefitsChange}
          catalogServices={catalogServices}
        />
      )}

      {error ? (
        <div className="mt-4">
          <AuthAlert variant="error">{error}</AuthAlert>
        </div>
      ) : null}
    </Modal>
  );
};
