import React, { useMemo, useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { SearchSelect } from '../../components/ui/SearchSelect';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  PlugZap,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useChavesPix } from '../../features/pix-keys/hooks/useChavesPix';
import { ChavePix, TIPO_CHAVE_PIX_VALUES } from '../../features/pix-keys/schemas/chavePixSchemas';
import { useControleAcesso } from '../../features/controle-acesso/hooks/useControleAcesso';
import {
  ControleAcessoListItem,
  EstadoAcesso,
} from '../../features/controle-acesso/schemas/controleAcessoSchemas';

const TIPO_CHAVE_OPTIONS = TIPO_CHAVE_PIX_VALUES.map((value) => ({
  value,
  label: value === 'Aleatoria' ? 'Aleatória' : value,
}));

const ESTADO_LABEL: Record<EstadoAcesso, string> = {
  Ativo: 'Ativo',
  Inativo: 'Inativo',
  Solicitado: 'Solicitado',
};

const estadoBadgeClass = (estado: EstadoAcesso): string => {
  if (estado === 'Ativo') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (estado === 'Solicitado') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

export const Integracoes: React.FC = () => {
  const { addToast } = useToast();
  const { chaves, isLoading: loadingPix, error: pixError, create, deactivate } = useChavesPix();
  const {
    masterList,
    myRequest,
    isMaster,
    isLoading: loadingControle,
    error: controleError,
    requestAccess,
    updateRequest,
  } = useControleAcesso();

  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [chave, setChave] = useState('');
  const [tipoChave, setTipoChave] = useState<string | number>('CPF');
  const [isSavingPix, setIsSavingPix] = useState(false);

  const [requestPayment, setRequestPayment] = useState(true);
  const [requestWhatsapp, setRequestWhatsapp] = useState(false);
  const [requestPassword, setRequestPassword] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [isUpdatingMaster, setIsUpdatingMaster] = useState<number | null>(null);

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
    setIsRequesting(true);
    try {
      await requestAccess({
        payment: requestPayment ? 'Solicitado' : 'Inativo',
        whatsapp: requestWhatsapp ? 'Solicitado' : 'Inativo',
        password: requestPassword,
      });
      addToast('success', 'Solicitação enviada', 'Aguarde aprovação do time PagWeb.');
      setRequestPassword('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao solicitar acesso';
      addToast('error', 'Erro', msg);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleMasterApprove = async (item: ControleAcessoListItem) => {
    setIsUpdatingMaster(item.idControle);
    try {
      await updateRequest({
        idControle: item.idControle,
        payment: 'Ativo',
        whatsapp: 'Ativo',
        estado: 'Ativo',
      });
      addToast('success', 'Acesso liberado', `${item.nomeEmpresa} foi ativada.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao aprovar solicitação';
      addToast('error', 'Erro', msg);
    } finally {
      setIsUpdatingMaster(null);
    }
  };

  const handleMasterReject = async (item: ControleAcessoListItem) => {
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
    <BusinessLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Integrações</h1>
        <p className="text-gray-500 mt-1">
          Cadastre sua chave PIX para receber na caixa e solicite acesso aos serviços Bixs.
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
                  <h2 className="text-lg font-semibold text-gray-900">Chave PIX (caixa)</h2>
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
                <h2 className="text-lg font-semibold text-gray-900">Solicitar integração Bixs</h2>
                <p className="text-sm text-gray-500">
                  Peça ativação de pagamentos e WhatsApp para sua empresa.
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
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Solicitação registrada
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
                  <h2 className="text-lg font-semibold text-gray-900">Painel Master — aprovações</h2>
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
                        <span
                          className={`inline-block mt-2 px-2 py-0.5 rounded-full border text-xs ${estadoBadgeClass(item.estado)}`}
                        >
                          {ESTADO_LABEL[item.estado]}
                        </span>
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
    </BusinessLayout>
  );
};
