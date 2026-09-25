import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  FileCheck2,
  QrCode,
  Copy,
  Check,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PublicPlanDetails {
  nome: string;
  valorMensalidade: number;
  funcionalidades?: string[];
}

interface PublicSubscriptionData {
  id?: number;
  publicToken: string;
  nomeCliente: string;
  nomePlano: string;
  status: string; // 'Pendente' | 'Ativo' | 'Cancelado'
  diaPagamento: number;
  periodo: number;
  valorComDesconto?: number;
  empresa: {
    nome: string;
    cnpj?: string;
    logo?: string | null;
  };
  plano?: PublicPlanDetails;
  contratoUrl?: string;
  primeiraMensalidade?: {
    idMensalidade: number;
    valor: number;
    codigoPix?: string;
  };
}

const BASE_URL = 'https://lojas.vlks.com.br/api/v1';

export const PublicSubscriptionAccept: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [subscription, setSubscription] = useState<PublicSubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);
  const [pixCode, setPixCode] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!token) {
      setError('Identificador da proposta de assinatura não informado.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/Assinatura/publico/${token}`, {
        headers: { accept: '*/*' },
      });

      if (!res.ok) {
        if (res.status === 404) {
          setError('Proposta de assinatura não encontrada ou link expirado.');
        } else {
          setError('Não foi possível carregar as informações do plano.');
        }
        return;
      }

      const data: PublicSubscriptionData = await res.json();
      setSubscription(data);
      if (data.status === 'Ativo') {
        setIsAccepted(true);
      }
      if (data.primeiraMensalidade?.codigoPix) {
        setPixCode(data.primeiraMensalidade.codigoPix);
      }
    } catch {
      setError('Erro de conexão ao buscar proposta. Verifique sua conexão com a internet.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchSubscription();
  }, [fetchSubscription]);

  const handleAccept = async () => {
    if (!token) return;
    try {
      setIsAccepting(true);
      setAcceptError(null);
      const res = await fetch(`${BASE_URL}/Assinatura/publico/aceitar/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
      });

      if (!res.ok) {
        throw new Error('Falha ao registrar aceite da assinatura.');
      }

      const data = await res.json();
      setIsAccepted(true);
      if (data.codigoPix || data.primeiraMensalidade?.codigoPix) {
        setPixCode(data.codigoPix || data.primeiraMensalidade.codigoPix);
      }
    } catch (err: unknown) {
      setAcceptError(err instanceof Error ? err.message : 'Erro ao confirmar aceite.');
    } finally {
      setIsAccepting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const formatBRL = (val?: number) => {
    if (val == null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 antialiased font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">PagWeb</span>
          </div>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Adesão Segura
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl w-full mx-auto px-4 py-6 md:py-10 flex-1">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <Loader2 className="w-8 h-8 text-slate-900 animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-600">Carregando detalhes do plano...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Link Indisponível</h2>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => void fetchSubscription()}
              className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition"
            >
              Tentar Novamente
            </button>
          </div>
        ) : subscription ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {subscription.empresa?.logo ? (
                    <img
                      src={subscription.empresa.logo}
                      alt={subscription.empresa.nome}
                      className="w-12 h-12 rounded-xl object-contain border border-slate-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h1 className="font-bold text-slate-900 text-lg leading-tight">
                      {subscription.empresa?.nome || 'Estabelecimento'}
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Proposta de adesão ao plano de assinatura
                    </p>
                  </div>
                </div>

                {isAccepted ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Assinatura Ativa
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Pendente de Aceite
                  </span>
                )}
              </div>

              {/* Plan overview */}
              <div className="bg-slate-50 rounded-xl p-5 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                      Plano
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {subscription.nomePlano || subscription.plano?.nome || 'Plano Recorrente'}
                    </h2>
                  </div>
                  <div className="text-right sm:text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {formatBRL(subscription.valorComDesconto || subscription.plano?.valorMensalidade)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium block">/ mês</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Vencimento: Todo dia {subscription.diaPagamento || 10}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-slate-400" />
                    <span>
                      Duração: {subscription.periodo ? `${subscription.periodo} meses` : 'Contínua'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              {subscription.plano?.funcionalidades && subscription.plano.funcionalidades.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Benefícios Inclusos
                  </h3>
                  <ul className="space-y-1.5 text-sm text-slate-700">
                    {subscription.plano.funcionalidades.map((func, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{func}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Term clause */}
              <div className="bg-slate-100 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed">
                Ao clicar em &quot;Concordar e Ativar Assinatura&quot;, você declara que concorda com os
                termos do plano e autoriza o envio das faturas mensais no valor indicado para o seu
                WhatsApp e e-mail.
              </div>
            </div>

            {/* Actions Card */}
            {acceptError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{acceptError}</span>
              </div>
            )}

            {!isAccepted ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center">
                <button
                  type="button"
                  disabled={isAccepting}
                  onClick={() => void handleAccept()}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition inline-flex items-center justify-center gap-2 shadow-xs"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando Aceite...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Concordar e Ativar Assinatura
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Assinatura Ativada!</h3>
                <p className="text-sm text-slate-600">
                  Sua adesão foi confirmada. Efetue o pagamento da 1ª mensalidade abaixo para concluir:
                </p>

                {pixCode && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block space-y-3">
                    <div className="p-3 bg-white border border-slate-100 rounded-xl inline-block">
                      <QRCodeSVG value={pixCode} size={180} level="M" />
                    </div>
                    <div className="flex items-center gap-2 max-w-sm mx-auto">
                      <input
                        type="text"
                        readOnly
                        value={pixCode}
                        className="flex-1 text-xs font-mono bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-600 select-all"
                      />
                      <button
                        type="button"
                        onClick={() => void copyToClipboard(pixCode)}
                        className="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? 'Copiado' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        <p>Adesão e cobranças gerenciadas com segurança pela plataforma PagWeb.</p>
      </footer>
    </div>
  );
};
