import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Loader2,
  PenLine,
  Repeat,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';
import { SignaturePadModal } from '../../ui/SignaturePadModal';
import { CameraCaptureModal } from '../../ui/CameraCaptureModal';
import { SubscribeFormState, usePlanSubscribe } from '../../../hooks/usePlanSubscribe';
import { getContractUrl } from '../../../utils/api';
import { downloadBlob } from '../../../utils/contractPdf';

type PlanSubscribeController = ReturnType<typeof usePlanSubscribe>;

interface PlanSubscribeModalProps {
  controller: PlanSubscribeController;
}

/** Modal multi-etapas para assinatura de plano pelo cliente. */
export const PlanSubscribeModal: React.FC<PlanSubscribeModalProps> = ({ controller }) => {
  const {
    isOpen,
    isSubscribing,
    plan,
    establishmentName,
    subscribeStep,
    subscribeForm,
    setSubscribeForm,
    mergedContractPdfUrl,
    mergedContractBlob,
    isBuildingMergedPdf,
    close,
    goNext,
    goPrev,
    confirmSubscription,
    getSubscribeSteps,
    requiresSignedContract,
    requiresContractAck,
  } = controller;

  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  if (!plan) return null;

  const steps = getSubscribeSteps(plan);
  const currentStep = steps[subscribeStep];
  const isFirst = subscribeStep === 0;
  const isLast = subscribeStep === steps.length - 1;

  const openContract = () => {
    if (!plan.contratoPath) return;
    window.open(getContractUrl(plan.contratoPath), '_blank');
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={close}
        title={`Assinar plano — etapa ${subscribeStep + 1} de ${steps.length}`}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => (isFirst ? close() : goPrev())} disabled={isSubscribing}>
              {isFirst ? 'Cancelar' : (
                <>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Voltar
                </>
              )}
            </Button>
            {isLast ? (
              <Button
                onClick={() => void confirmSubscription()}
                isLoading={isSubscribing}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                Confirmar Assinatura
              </Button>
            ) : (
              <Button onClick={goNext} className="bg-slate-900 hover:bg-slate-800 text-white">
                Próximo
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </>
        }
      >
        <div className="space-y-4">
          <Stepper steps={steps} activeIndex={subscribeStep} />

          <div className="max-h-[52vh] overflow-y-auto pr-1 custom-scrollbar">
            {currentStep?.id === 'plano' && (
              <PlanStep plan={plan} establishmentName={establishmentName} />
            )}
            {currentStep?.id === 'config' && (
              <ConfigStep form={subscribeForm} onChange={setSubscribeForm} />
            )}
            {currentStep?.id === 'contrato' && (
              <ContractStep
                plan={plan}
                form={subscribeForm}
                onChange={setSubscribeForm}
                requiresSigned={requiresSignedContract(plan)}
                requiresAck={requiresContractAck(plan)}
                onOpenSignature={() => setIsSignatureModalOpen(true)}
                onOpenCamera={() => setIsCameraModalOpen(true)}
                onOpenContract={openContract}
              />
            )}
            {currentStep?.id === 'confirmacao' && (
              <ConfirmStep
                plan={plan}
                establishmentName={establishmentName}
                form={subscribeForm}
                requiresSigned={requiresSignedContract(plan)}
                mergedPdfUrl={mergedContractPdfUrl}
                mergedBlob={mergedContractBlob}
                isBuilding={isBuildingMergedPdf}
              />
            )}
          </div>
        </div>
      </Modal>

      <SignaturePadModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        initialSignature={subscribeForm.signatureDataUrl}
        onSave={(dataUrl) => setSubscribeForm((prev) => ({ ...prev, signatureDataUrl: dataUrl }))}
      />
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        initialPhoto={subscribeForm.photoDataUrl}
        onCapture={(dataUrl) => setSubscribeForm((prev) => ({ ...prev, photoDataUrl: dataUrl }))}
      />
    </>
  );
};

const Stepper: React.FC<{
  steps: { id: string; label: string }[];
  activeIndex: number;
}> = ({ steps, activeIndex }) => (
  <div className="flex items-center justify-between gap-1 px-1">
    {steps.map((step, index) => (
      <React.Fragment key={step.id}>
        <div className="flex flex-col items-center flex-1 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              index < activeIndex
                ? 'bg-green-600 text-white'
                : index === activeIndex
                  ? 'bg-slate-900 text-white'
                  : 'bg-gray-100 text-gray-400'
            }`}
          >
            {index < activeIndex ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
          </div>
          <span
            className={`text-[10px] mt-1 truncate w-full text-center ${
              index === activeIndex ? 'text-slate-900 font-medium' : 'text-gray-400'
            }`}
          >
            {step.label}
          </span>
        </div>
        {index < steps.length - 1 && (
          <div className={`h-0.5 flex-1 mb-4 ${index < activeIndex ? 'bg-green-500' : 'bg-gray-200'}`} />
        )}
      </React.Fragment>
    ))}
  </div>
);

const PlanStep: React.FC<{ plan: PlanSubscribeController['plan']; establishmentName: string }> = ({
  plan,
  establishmentName,
}) => {
  if (!plan) return null;
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <CreditCard className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{plan.nome}</h3>
        <p className="text-sm text-gray-500">{establishmentName}</p>
        <p className="text-2xl font-bold text-slate-900 mt-2">
          R$ {plan.valorMensalidade.toFixed(2).replace('.', ',')}
          <span className="text-sm font-normal text-gray-500">/mês</span>
        </p>
      </div>
      {plan.funcionalidades && plan.funcionalidades.length > 0 && (
        <ul className="bg-gray-50 rounded-lg p-4 border border-gray-100 space-y-1.5">
          {plan.funcionalidades.map((func) => (
            <li key={func} className="flex items-start text-sm text-gray-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mr-2 shrink-0 mt-0.5" />
              {func}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ConfigStep: React.FC<{
  form: SubscribeFormState;
  onChange: React.Dispatch<React.SetStateAction<SubscribeFormState>>;
}> = ({ form, onChange }) => (
  <div className="space-y-4">
    <label className="flex items-center cursor-pointer gap-2 p-3 border border-gray-200 rounded-lg">
      <input
        type="checkbox"
        checked={form.isRecorrente}
        onChange={(e) => onChange((prev) => ({ ...prev, isRecorrente: e.target.checked }))}
        className="w-4 h-4 accent-slate-900"
      />
      <span className="flex items-center text-sm text-gray-700 font-medium">
        <Repeat className="w-4 h-4 mr-2 text-slate-500" />
        Assinatura recorrente
      </span>
    </label>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Período (meses)</label>
        <input
          type="number"
          min={1}
          value={form.periodo}
          disabled={form.isRecorrente}
          onChange={(e) => onChange((prev) => ({ ...prev, periodo: e.target.value }))}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
            form.isRecorrente ? 'bg-gray-100 text-gray-400' : ''
          }`}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Dia de pagamento</label>
        <input
          type="number"
          min={1}
          max={30}
          value={form.diaPagamento}
          onChange={(e) => onChange((prev) => ({ ...prev, diaPagamento: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
      </div>
    </div>
  </div>
);

const ContractStep: React.FC<{
  plan: NonNullable<PlanSubscribeController['plan']>;
  form: SubscribeFormState;
  onChange: React.Dispatch<React.SetStateAction<SubscribeFormState>>;
  requiresSigned: boolean;
  requiresAck: boolean;
  onOpenSignature: () => void;
  onOpenCamera: () => void;
  onOpenContract: () => void;
}> = ({ plan, form, onChange, requiresSigned, requiresAck, onOpenSignature, onOpenCamera, onOpenContract }) => (
  <div className="space-y-4">
    {plan.contratoPath ? (
      <>
        <iframe src={getContractUrl(plan.contratoPath)} title="Contrato" className="w-full h-40 border rounded-lg" />
        <Button type="button" variant="outline" className="w-full" onClick={onOpenContract}>
          <Download className="w-4 h-4 mr-2" />
          Abrir em nova aba
        </Button>
      </>
    ) : (
      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-3">
        Este plano exige aceite, mas não possui PDF cadastrado.
      </p>
    )}
    {requiresSigned && (
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={onOpenSignature}>
          <PenLine className="w-4 h-4 mr-2" />
          Assinar
        </Button>
        <Button type="button" variant="outline" onClick={onOpenCamera}>
          <Camera className="w-4 h-4 mr-2" />
          Tirar foto
        </Button>
      </div>
    )}
    {requiresAck && (
      <label className="flex items-start gap-2 text-sm p-3 border border-gray-200 rounded-lg">
        <input
          type="checkbox"
          checked={form.aceitouTermos}
          onChange={(e) => onChange((prev) => ({ ...prev, aceitouTermos: e.target.checked }))}
          className="mt-0.5"
        />
        Li e concordo com os termos/contrato deste plano.
      </label>
    )}
  </div>
);

const ConfirmStep: React.FC<{
  plan: NonNullable<PlanSubscribeController['plan']>;
  establishmentName: string;
  form: SubscribeFormState;
  requiresSigned: boolean;
  mergedPdfUrl: string | null;
  mergedBlob: Blob | null;
  isBuilding: boolean;
}> = ({ plan, establishmentName, form, requiresSigned, mergedPdfUrl, mergedBlob, isBuilding }) => (
  <div className="space-y-4">
    <div className="bg-gray-50 rounded-lg p-4 border text-sm space-y-2">
      <Row label="Estabelecimento" value={establishmentName} />
      <Row label="Plano" value={plan.nome} />
      <Row
        label="Valor"
        value={`R$ ${plan.valorMensalidade.toFixed(2).replace('.', ',')}`}
      />
      <Row
        label="Tipo"
        value={form.isRecorrente ? 'Recorrente' : `${form.periodo} meses`}
      />
    </div>
    {isBuilding ? (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    ) : mergedPdfUrl ? (
      <iframe src={mergedPdfUrl} title="Contrato final" className="w-full h-56 border rounded-lg" />
    ) : plan.contratoPath ? (
      <iframe
        src={getContractUrl(plan.contratoPath)}
        title="Contrato"
        className="w-full h-56 border rounded-lg"
      />
    ) : null}
    {mergedBlob && (
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() =>
          downloadBlob(mergedBlob, `contrato-${plan.nome.replace(/\s+/g, '-')}.pdf`)
        }
      >
        <Download className="w-4 h-4 mr-2" />
        Baixar PDF
      </Button>
    )}
    {requiresSigned && (
      <p className="text-[11px] text-gray-400 text-center">
        O PDF final inclui assinatura e foto quando aplicável.
      </p>
    )}
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between gap-2">
    <span className="text-gray-500">{label}</span>
    <span className="font-medium text-gray-900 text-right">{value}</span>
  </div>
);
