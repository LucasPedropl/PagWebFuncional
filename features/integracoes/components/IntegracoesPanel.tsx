import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { SearchSelect } from '../../../components/ui/SearchSelect';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  PlugZap,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useChavesPix } from '../../pix-keys/hooks/useChavesPix';
import { ChavePix, TIPO_CHAVE_PIX_VALUES } from '../../pix-keys/schemas/chavePixSchemas';
import { useControleAcesso, ControleAcessoMasterItem } from '../../controle-acesso/hooks/useControleAcesso';
import { EstadoAcesso } from '../../controle-acesso/schemas/controleAcessoSchemas';
import {
  controleAcessoService,
  VerificationCodeEndpointMissingError,
} from '../../controle-acesso/services/controleAcessoService';
import { ESTADO_ACESSO_LABEL } from '../../controle-acesso/utils/moduleAccess';

const TIPO_CHAVE_OPTIONS = TIPO_CHAVE_PIX_VALUES.map((value) => ({
  value,
  label: value === 'Aleatoria' ? 'Aleatória' : value,
}));

const ESTADO_LABEL = ESTADO_ACESSO_LABEL;

/** Janela mínima entre dois envios de OTP. */
const RESEND_COOLDOWN_SECONDS = 60;

const estadoBadgeClass = (estado: EstadoAcesso): string => {
  if (estado === 'Ativo') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (estado === 'Solicitado') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

export const IntegracoesPanel: React.FC = () => {
  const { addToast } = useToast();
  const { chaves, isLoading: loadingPix, error: pixError, create, deactivate } = useChavesPix();
  const {
    masterList,
    myRequest,
    isMaster,
    isLoading: loadingControle,
    error: controleError,
    requestAccess,
    sendVerificationCode,
    updateRequest,
  } = useControleAcesso();
  const [searchParams] = useSearchParams();

  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [chave, setChave] = useState('');
  const [tipoChave, setTipoChave] = useState<string | number>('CPF');
  const [isSavingPix, setIsSavingPix] = useState(false);

  // Pré-seleção vinda de /tornar-estabelecimento (?modulos=payment,whatsapp)
  const [requestPayment, setRequestPayment] = useState(() => {
    const modulos = searchParams.get('modulos');
    return modulos === null ? true : modulos.includes('payment');
  });
  const [requestWhatsapp, setRequestWhatsapp] = useState(() => {
    const modulos = searchParams.get('modulos');
    return modulos === null ? false : modulos.includes('whatsapp');
  });
  const [requestPassword, setRequestPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeNotice, setCodeNotice] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isUpdatingMaster, setIsUpdatingMaster] = useState<number | null>(null);

  const isCoolingDown = resendCooldown > 0;

  useEffect(() => {
    if (!isCoolingDown) return;
    const timer = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCoolingDown]);

  const activeChaves = useMemo(
    () => chaves.filter((item) => item.status !== false),
    [chaves],
  );

  const handleCreatePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chave.trim() || !tipoChave) {
      addToast('error', 'Campos obrigatórios', 'Informe a chave e o tipo.');
      return;
    }
    setIsSavingPix(true);
    try {
      await create({
        chave: chave.trim(),
        tipoChave: String(tipoChave),
      });
      addToast('success', 'Chave cadastrada', 'Sua chave PIX está pronta para receber pagamentos na caixa.');
      setIsPixModalOpen(false);
      setChave('');
      setTipoChave('CPF');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar chave PIX';
      addToast('error', 'Erro', msg);
    } finally {
      setIsSavingPix(false);
    }
  };

  const handleDeactivatePix = async (item: ChavePix) => {
    try {
      await deactivate(item.idChavePix);
      addToast('success', 'Chave desativada', 'A chave PIX foi desativada.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao desativar chave PIX';
      addToast('error', 'Erro', msg);
    }
  };

  const handleSendVerificationCode = async () => {
    setIsSendingCode(true);
    try {
      const result = await sendVerificationCode();
      const minutes = Math.round(result.expiresInSeconds / 60);
      addToast(
        'success',
        'Código enviado',
        result.sentTo
          ? `Enviamos um código de 6 dígitos para ${result.sentTo}. Válido por ${minutes} minutos.`
          : `Enviamos um código de 6 dígitos para o e-mail do administrador. Válido por ${minutes} minutos.`,
      );
      setCodeNotice(null);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      // Endpoint ainda não publicado: o campo continua utilizável com código do suporte
      if (err instanceof VerificationCodeEndpointMissingError) {
        setCodeNotice(err.message);
        addToast('error', 'Envio automático indisponível', err.message);
        return;
      }
      const msg = err instanceof Error ? err.message : 'Erro ao enviar código de verificação';
      setCodeNotice(null);
      addToast('error', 'Erro', msg);
    } finally {
      setIsSendingCode(false);
    }
  };

  const isReopeningInactive = myRequest?.estado === 'Inativo';

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestPassword.trim()) {
      addToast('error', 'Senha obrigatória', 'Confirme sua senha para solicitar integração.');
      return;
    }
    if (!requestPayment && !requestWhatsapp) {
      addToast('error', 'Seleção obrigatória', 'Marque ao menos Pagamentos ou WhatsApp.');
      return;
    }
    if (!/^\d{6}$/.test(verificationCode)) {
      addToast(
        'error',
        'Código obrigatório',
        'Informe o código de 6 dígitos enviado por e-mail.',
      );
      return;
    }
    setIsRequesting(true);
    try {
      await requestAccess({
        payment: requestPayment ? 'Solicitado' : 'Inativo',
        whatsapp: requestWhatsapp ? 'Solicitado' : 'Inativo',
        password: requestPassword,
        verificationCode,
      });
      addToast(
        'success',
        isReopeningInactive ? 'Solicitação reaberta' : 'Solicitação enviada',
        'Aguarde aprovação do time PagWeb.',
      );
      setRequestPassword('');
      setVerificationCode('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao solicitar acesso';
      addToast('error', 'Erro', msg);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleMasterApprove = async (item: ControleAcessoMasterItem) => {
    setIsUpdatingMaster(item.idControle);
    const wantedPaymentAtivo = item.payment !== 'Inativo';
    const wantedWhatsappAtivo = item.whatsapp !== 'Inativo';
    try {
      await updateRequest({
        idControle: item.idControle,
        payment: wantedPaymentAtivo ? 'Ativo' : 'Inativo',
        whatsapp: wantedWhatsappAtivo ? 'Ativo' : 'Inativo',
        estado: 'Ativo',
      });
      const detail = await controleAcessoService.getById(item.idControle);
      const paymentFailed = wantedPaymentAtivo && detail?.payment === 'Inativo';
      const whatsappFailed = wantedWhatsappAtivo && detail?.whatsapp === 'Inativo';
      if (paymentFailed || whatsappFailed) {
        const failed = [
          paymentFailed ? 'Pagamentos' : null,
          whatsappFailed ? 'WhatsApp' : null,
        ].filter(Boolean);
        addToast(
          'error',
          'Liberação parcial',
          `${item.nomeEmpresa} ficou Ativa, mas ${failed.join(' e ')} não ativaram na Bixs. Retente no pagweb-admin.`,
        );
      } else {
        addToast('success', 'Acesso liberado', `${item.nomeEmpresa} foi ativada.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao aprovar solicitação';
      addToast('error', 'Erro', msg);
    } finally {
      setIsUpdatingMaster(null);
    }
  };

  const handleMasterReject = async (item: ControleAcessoMasterItem) => {
    setIsUpdatingMaster(item.idControle);
    try {
      await updateRequest({
        idControle: item.idControle,
        payment: 'Inativo',
        whatsapp: 'Inativo',
        estado: 'Inativo',
      });
      addToast('success', 'Solicitação recusada', `${item.nomeEmpresa} permanece inativa.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao recusar solicitação';
      addToast('error', 'Erro', msg);
    } finally {
      setIsUpdatingMaster(null);
    }
  };

  const isLoading = loadingPix || loadingControle;

  return (
    <div className="animate-fadeIn space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Integrações</h2>
        <p className="text-sm text-gray-500 mt-1">
          Cadastre sua chave PIX, solicite liberação de Pagamentos/WhatsApp e acompanhe a
          aprovação do time PagWeb. Cadastro de cobranças funciona sem liberação; PIX, boleto e
          WhatsApp só após o desbloqueio.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : (
        <div className="space-y-8">
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-700">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Chave PIX (caixa)</h3>
                  <p className="text-sm text-gray-500">
                    Obrigatória para o método <strong>PIX na caixa</strong> nos pagamentos.
                  </p>
                </div>
              </div>
              <Button onClick={() => setIsPixModalOpen(true)}>
                Nova chave PIX
              </Button>
            </div>

            {pixError ? (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {pixError}
              </div>
            ) : activeChaves.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhuma chave ativa. Cadastre uma chave antes de aceitar PIX na caixa.
              </p>
            ) : (
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                {activeChaves.map((item) => (
                  <div key={item.idChavePix} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.chave}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tipo: {item.tipoChave} · Ativa
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDeactivatePix(item)}
                      className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                      aria-label="Desativar chave PIX"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-3 mb-6">
              <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
                <PlugZap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Solicitar integração Bixs</h3>
                <p className="text-sm text-gray-500">
                  Peça ativação de pagamentos e WhatsApp para sua empresa. A ativação exige um
                  código de verificação enviado por e-mail para o administrador — ele vale 15
                  minutos e só pode ser usado uma vez.
                </p>
              </div>
            </div>

            {controleError ? (
              <div className="flex items-center gap-2 text-sm text-red-600 mb-4">
                <AlertCircle className="w-4 h-4" />
                {controleError}
              </div>
            ) : null}

            {myRequest ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                    {myRequest.estado === 'Inativo' ? (
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {myRequest.estado === 'Inativo'
                      ? 'Solicitação recusada ou desativada'
                      : 'Solicitação registrada'}
                  </div>
                  <p className="text-sm text-gray-600">
                    Empresa: {myRequest.nomeEmpresa || '—'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`px-2 py-1 rounded-full border ${estadoBadgeClass(myRequest.estado)}`}>
                      Geral: {ESTADO_LABEL[myRequest.estado]}
                    </span>
                    <span className={`px-2 py-1 rounded-full border ${estadoBadgeClass(myRequest.payment)}`}>
                      Pagamentos: {ESTADO_LABEL[myRequest.payment]}
                    </span>
                    <span className={`px-2 py-1 rounded-full border ${estadoBadgeClass(myRequest.whatsapp)}`}>
                      WhatsApp: {ESTADO_LABEL[myRequest.whatsapp]}
                    </span>
                  </div>
                  {myRequest.dataSolicitado ? (
                    <p className="text-xs text-gray-500">Solicitado em {myRequest.dataSolicitado}</p>
                  ) : null}
                </div>

                {myRequest.estado === 'Inativo' ? (
                  <div className="space-y-4 max-w-lg">
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>
                        Você pode solicitar novamente. A API reabre a solicitação para o time
                        PagWeb aprovar. Informe senha e código de verificação (exigidos pelo
                        contrato do endpoint).
                      </span>
                    </div>
                    <form onSubmit={handleRequestAccess} className="space-y-4">
                      <label className="flex items-center gap-3 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={requestPayment}
                          onChange={(e) => setRequestPayment(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        Solicitar módulo de Pagamentos (Bixs)
                      </label>
                      <label className="flex items-center gap-3 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={requestWhatsapp}
                          onChange={(e) => setRequestWhatsapp(e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        Solicitar módulo de WhatsApp (Bixs)
                      </label>
                      <Input
                        label="Senha da conta (confirmação)"
                        type="password"
                        value={requestPassword}
                        onChange={(e) => setRequestPassword(e.target.value)}
                        placeholder="Sua senha de administrador"
                      />
                      <div className="space-y-2">
                        <Input
                          label="Código de verificação (6 dígitos)"
                          value={verificationCode}
                          onChange={(e) =>
                            setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder="000000"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:w-auto"
                          isLoading={isSendingCode}
                          disabled={isCoolingDown}
                          onClick={() => void handleSendVerificationCode()}
                        >
                          {isCoolingDown ? `Reenviar em ${resendCooldown}s` : 'Enviar código'}
                        </Button>
                        {codeNotice ? (
                          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{codeNotice}</span>
                          </div>
                        ) : null}
                      </div>
                      <Button type="submit" isLoading={isRequesting}>
                        Solicitar novamente
                      </Button>
                    </form>
                  </div>
                ) : null}
              </div>
            ) : isMaster ? (
              <p className="text-sm text-gray-500">
                Conta Master não solicita integração — use o painel de aprovações abaixo.
              </p>
            ) : (
              <form onSubmit={handleRequestAccess} className="space-y-4 max-w-lg">
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={requestPayment}
                    onChange={(e) => setRequestPayment(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Solicitar módulo de Pagamentos (Bixs)
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={requestWhatsapp}
                    onChange={(e) => setRequestWhatsapp(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Solicitar módulo de WhatsApp (Bixs)
                </label>
                <Input
                  label="Senha da conta (confirmação)"
                  type="password"
                  value={requestPassword}
                  onChange={(e) => setRequestPassword(e.target.value)}
                  placeholder="Sua senha de administrador"
                />
                <div className="space-y-2">
                  <Input
                    label="Código de verificação (6 dígitos)"
                    value={verificationCode}
                    onChange={(e) =>
                      setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="000000"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    isLoading={isSendingCode}
                    disabled={isCoolingDown}
                    onClick={() => void handleSendVerificationCode()}
                  >
                    {isCoolingDown ? `Reenviar em ${resendCooldown}s` : 'Enviar código'}
                  </Button>
                  {codeNotice ? (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{codeNotice}</span>
                    </div>
                  ) : null}
                </div>
                <Button type="submit" isLoading={isRequesting}>
                  Enviar solicitação
                </Button>
              </form>
            )}
          </section>

          {isMaster ? (
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-3 mb-6">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Painel Master — aprovações</h3>
                  <p className="text-sm text-gray-500">
                    Gerencie solicitações de acesso das empresas.
                  </p>
                </div>
              </div>

              {masterList.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma solicitação pendente no momento.</p>
              ) : (
                <div className="space-y-3">
                  {masterList.map((item) => (
                    <div
                      key={item.idControle}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-100"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.nomeEmpresa}</p>
                        <p className="text-xs text-gray-500">{item.cpfCnpj}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className={`px-2 py-0.5 rounded-full border ${estadoBadgeClass(item.estado)}`}>
                            Geral: {ESTADO_LABEL[item.estado]}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border ${estadoBadgeClass(item.payment)}`}>
                            Pagamentos: {ESTADO_LABEL[item.payment]}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border ${estadoBadgeClass(item.whatsapp)}`}>
                            WhatsApp: {ESTADO_LABEL[item.whatsapp]}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="bg-emerald-600 hover:bg-emerald-700"
                          isLoading={isUpdatingMaster === item.idControle}
                          onClick={() => void handleMasterApprove(item)}
                        >
                          Aprovar
                        </Button>
                        <Button
                          type="button"
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700"
                          disabled={isUpdatingMaster === item.idControle}
                          onClick={() => void handleMasterReject(item)}
                        >
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : null}
        </div>
      )}

      <Modal
        isOpen={isPixModalOpen}
        onClose={() => setIsPixModalOpen(false)}
        title="Cadastrar chave PIX"
      >
        <form onSubmit={handleCreatePix} className="space-y-4">
          <SearchSelect
            label="Tipo da chave"
            options={TIPO_CHAVE_OPTIONS}
            value={tipoChave}
            onChange={setTipoChave}
            placeholder="Selecione o tipo..."
          />
          <Input
            label="Chave PIX"
            value={chave}
            onChange={(e) => setChave(e.target.value)}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={() => setIsPixModalOpen(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSavingPix} className="flex-1">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
