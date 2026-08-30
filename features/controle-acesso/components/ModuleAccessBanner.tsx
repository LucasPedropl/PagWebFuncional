import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Lock, Clock3, Loader2 } from 'lucide-react';
import type { EstadoAcesso } from '../schemas/controleAcessoSchemas';
import { ESTADO_ACESSO_LABEL } from '../utils/moduleAccess';

type ModuleKind = 'payment' | 'whatsapp';

interface ModuleAccessBannerProps {
  module: ModuleKind;
  status: EstadoAcesso;
  unlocked: boolean;
  isLoading?: boolean;
  className?: string;
}

const COPY: Record<
  ModuleKind,
  { titleLocked: string; titlePending: string; bodyLocked: string; bodyPending: string }
> = {
  payment: {
    titleLocked: 'Pagamentos (PIX/boleto) não liberados',
    titlePending: 'Pagamentos aguardando liberação',
    bodyLocked:
      'Você pode cadastrar cobranças e mensalidades, mas clientes ainda não conseguem gerar PIX ou boleto. Solicite o módulo em Integrações.',
    bodyPending:
      'Sua solicitação do módulo de Pagamentos foi enviada. Após o time PagWeb desbloquear, PIX e boleto passam a funcionar para seus clientes.',
  },
  whatsapp: {
    titleLocked: 'WhatsApp não liberado',
    titlePending: 'WhatsApp aguardando liberação',
    bodyLocked:
      'A conexão WhatsApp só fica disponível depois que o módulo for solicitado e aprovado em Integrações.',
    bodyPending:
      'Sua solicitação do módulo WhatsApp foi enviada. Assim que for aprovada, você poderá conectar o número aqui.',
  },
};

export const ModuleAccessBanner: React.FC<ModuleAccessBannerProps> = ({
  module,
  status,
  unlocked,
  isLoading,
  className = '',
}) => {
  // Enquanto o status é desconhecido, ocupa o mesmo espaço que o aviso vai ocupar.
  // Devolver null aqui era metade do salto: a tela nascia sem aviso e ganhava um
  // bloco de 100px quando o `status-acesso` respondia.
  if (isLoading) {
    return (
      <div
        className={`flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 ${className}`}
        role="status"
        aria-busy="true"
      >
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-slate-200" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
          <div className="h-3 w-full max-w-md animate-pulse rounded bg-slate-200/80" />
        </div>
      </div>
    );
  }

  if (unlocked) return null;

  const copy = COPY[module];
  const isPending = status === 'Solicitado';
  const Icon = isPending ? Clock3 : Lock;

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-start gap-3 rounded-2xl border px-4 py-3.5 ${
        isPending
          ? 'border-amber-200 bg-amber-50 text-amber-950'
          : 'border-slate-200 bg-slate-50 text-slate-800'
      } ${className}`}
      role="status"
    >
      <div
        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isPending ? 'bg-amber-100 text-amber-700' : 'bg-slate-200/80 text-slate-700'
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold tracking-tight">
          {isPending ? copy.titlePending : copy.titleLocked}
        </p>
        <p className="mt-1 text-sm leading-relaxed opacity-90">
          {isPending ? copy.bodyPending : copy.bodyLocked}
        </p>
        <p className="mt-2 text-xs font-medium opacity-80">
          Status: {ESTADO_ACESSO_LABEL[status]}
        </p>
      </div>
      <Link
        to="/business/configuracoes?tab=integracoes"
        className="shrink-0 self-start rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
      >
        Ir para Integrações
      </Link>
    </div>
  );
};

interface ModuleAccessLockOverlayProps {
  children: React.ReactNode;
  locked: boolean;
  /** Status ainda desconhecido. Vela o conteúdo em vez de liberá-lo por engano. */
  isLoading?: boolean;
  title?: string;
}

/**
 * Escurece/desabilita interações do bloco quando o módulo está trancado.
 *
 * **Enquanto o status carrega, o conteúdo já nasce velado.** Liberar por padrão
 * e trancar depois é o que fazia a tela aparecer clicável e virar bloqueada um
 * instante depois — e, pior, dava uma janela real de cliques em algo proibido.
 * Desconhecido não é liberado.
 */
export const ModuleAccessLockOverlay: React.FC<ModuleAccessLockOverlayProps> = ({
  children,
  locked,
  isLoading = false,
  title = 'Módulo bloqueado até liberação',
}) => {
  if (!locked && !isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/55 backdrop-blur-[1px]">
        <div className="mx-4 flex max-w-sm items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          {isLoading ? (
            <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-slate-400" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          )}
          <p className="text-sm text-slate-700">
            {isLoading ? 'Verificando a liberação do módulo…' : title}
          </p>
        </div>
      </div>
    </div>
  );
};
