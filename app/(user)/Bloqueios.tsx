import React, { useEffect, useMemo, useState } from 'react';
import { Ban, Loader2, ShieldOff, Store, CreditCard } from 'lucide-react';
import { UserLayout } from '../../components/layout/UserLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { SearchSelect } from '../../components/ui/SearchSelect';
import { useToast } from '../../context/ToastContext';
import { useBloqueios } from '../../features/bloqueios/hooks/useBloqueios';
import { userService } from '../../services/userService';
import { ClientConnection, ClientSubscription } from '../../types';

/** Página de gestão de bloqueios (empresas e planos). */
export const Bloqueios: React.FC = () => {
  const { addToast } = useToast();
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const {
    empresas,
    planos,
    isLoading,
    error,
    bloquearEmpresa,
    desbloquearEmpresa,
    bloquearPlano,
    desbloquearPlano,
  } = useBloqueios(buscaDebounced);

  const [connections, setConnections] = useState<ClientConnection[]>([]);
  const [subscriptions, setSubscriptions] = useState<ClientSubscription[]>([]);
  const [empresaToBlock, setEmpresaToBlock] = useState<string | number>('');
  const [planoToBlock, setPlanoToBlock] = useState<string | number>('');
  const [isActing, setIsActing] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setBuscaDebounced(busca.trim()), 300);
    return () => window.clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    void (async () => {
      try {
        const [conns, subs] = await Promise.all([
          userService.listConnections(),
          userService.listClientSubscriptions(),
        ]);
        setConnections(Array.isArray(conns) ? conns : []);
        setSubscriptions(Array.isArray(subs) ? subs : []);
      } catch (err) {
        console.error('[Bloqueios] load options', err);
      }
    })();
  }, []);

  const empresaOptions = useMemo(
    () =>
      connections.map((c) => ({
        value: c.idEmpresa,
        label: c.nomeEmpresa || `Empresa #${c.idEmpresa}`,
      })),
    [connections],
  );

  const planoOptions = useMemo(() => {
    const seen = new Set<number>();
    const opts: { value: number; label: string }[] = [];
    for (const s of subscriptions) {
      if (!s.idPlano || seen.has(s.idPlano)) continue;
      seen.add(s.idPlano);
      opts.push({
        value: s.idPlano,
        label: `${s.nomePlano || `Plano #${s.idPlano}`} — ${s.nomeEmpresa || ''}`,
      });
    }
    return opts;
  }, [subscriptions]);

  const handleBlockEmpresa = async () => {
    const id = Number(empresaToBlock);
    if (!id) {
      addToast('error', 'Erro', 'Selecione uma empresa.');
      return;
    }
    setIsActing(true);
    try {
      await bloquearEmpresa(id);
      addToast('success', 'Sucesso', 'Empresa bloqueada.');
      setEmpresaToBlock('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao bloquear';
      console.error(err);
      addToast('error', 'Erro', msg);
    } finally {
      setIsActing(false);
    }
  };

  const handleBlockPlano = async () => {
    const id = Number(planoToBlock);
    if (!id) {
      addToast('error', 'Erro', 'Selecione um plano.');
      return;
    }
    setIsActing(true);
    try {
      await bloquearPlano(id);
      addToast('success', 'Sucesso', 'Plano bloqueado.');
      setPlanoToBlock('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao bloquear plano';
      console.error(err);
      addToast('error', 'Erro', msg);
    } finally {
      setIsActing(false);
    }
  };

  return (
    <UserLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bloqueios</h1>
        <p className="text-gray-500 mt-1">
          Empresas e planos que você não deseja ver ou interagir.
        </p>
      </div>

      <div className="mb-6 max-w-md">
        <Input
          label="Buscar nos bloqueios"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome ou ID..."
        />
      </div>

      {error ? <p className="text-sm text-red-600 mb-4">{error}</p> : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-slate-500" />
            <h2 className="font-bold text-gray-900">Empresas bloqueadas</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <SearchSelect
                label="Bloquear empresa"
                options={empresaOptions}
                value={empresaToBlock}
                onChange={setEmpresaToBlock}
                placeholder="Selecione..."
              />
            </div>
            <Button
              onClick={() => void handleBlockEmpresa()}
              disabled={isActing}
              className="bg-slate-900 hover:bg-slate-800 text-white shrink-0"
            >
              <Ban className="w-4 h-4 mr-2" />
              Bloquear
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : empresas.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Nenhuma empresa bloqueada.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {empresas.map((e) => (
                <li key={e.idEmpresa} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{e.nomeEmpresa}</p>
                    <p className="text-xs text-gray-500">{e.cnpj || `#${e.idEmpresa}`}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void desbloquearEmpresa(e.idEmpresa).then(
                        () => addToast('success', 'Sucesso', 'Empresa desbloqueada.'),
                        (err: unknown) => {
                          const msg = err instanceof Error ? err.message : 'Erro';
                          addToast('error', 'Erro', msg);
                        },
                      )
                    }
                    className="text-xs"
                  >
                    <ShieldOff className="w-3.5 h-3.5 mr-1" />
                    Desbloquear
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-slate-500" />
            <h2 className="font-bold text-gray-900">Planos bloqueados</h2>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <SearchSelect
                label="Bloquear plano"
                options={planoOptions}
                value={planoToBlock}
                onChange={setPlanoToBlock}
                placeholder="Selecione..."
              />
            </div>
            <Button
              onClick={() => void handleBlockPlano()}
              disabled={isActing}
              className="bg-slate-900 hover:bg-slate-800 text-white shrink-0"
            >
              <Ban className="w-4 h-4 mr-2" />
              Bloquear
            </Button>
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : planos.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">Nenhum plano bloqueado.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {planos.map((p) => (
                <li key={p.idPlano} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{p.nomePlano}</p>
                    <p className="text-xs text-gray-500">
                      {p.nomeEmpresa} · R$ {p.valorPlano.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      void desbloquearPlano(p.idPlano).then(
                        () => addToast('success', 'Sucesso', 'Plano desbloqueado.'),
                        (err: unknown) => {
                          const msg = err instanceof Error ? err.message : 'Erro';
                          addToast('error', 'Erro', msg);
                        },
                      )
                    }
                    className="text-xs"
                  >
                    <ShieldOff className="w-3.5 h-3.5 mr-1" />
                    Desbloquear
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </UserLayout>
  );
};
