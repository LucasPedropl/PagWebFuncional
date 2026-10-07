import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useLocation, Link } from 'react-router-dom';
import {
  CreditCard,
  FileText,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Printer,
  QrCode,
  ArrowRight,
  Info,
  Building2,
  Lock,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { apiV1Url } from '../../utils/apiOrigin';

interface PaymentResponseData {
  codigo?: string;
  dataVencimento?: string;
}

export const PublicSubscriptionInvoice: React.FC = () => {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Extrai o token de acesso da mensalidade a partir da rota, query param ou hash
  const token = useMemo(() => {
    if (routeToken) {
      const clean = routeToken.replace(/^tokenAcesso=/i, '').trim();
      if (clean) return clean;
    }

    const queryToken = searchParams.get('tokenAcesso') || searchParams.get('token');
    if (queryToken?.trim()) return queryToken.trim();

    // Fallback via regex no hash completo da URL (#/p-assinatura/GUID)
    const fullHash = window.location.hash || location.pathname;
    const matchTokenParam = fullHash.match(/p-assinatura\/(?:tokenAcesso=)?([a-f0-9-]+)/i);
    if (matchTokenParam?.[1]) return matchTokenParam[1];

    const matchGuid = fullHash.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (matchGuid?.[1]) return matchGuid[1];

    return '';
  }, [routeToken, searchParams, location]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alreadyGenerated, setAlreadyGenerated] = useState(false);

  // Metodo ativo (padrao Boleto, conforme solicitado para clientes sem conta)
  const [activeMethod, setActiveMethod] = useState<'boleto' | 'pix'>('boleto');

  // Dados do boleto/pagamento retornado
  const [paymentCode, setPaymentCode] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Classificacao do codigo retornado (URL, linha digitavel, pix ou barcode)
  const isUrl = useMemo(() => {
    return /^https?:\/\//i.test(paymentCode.trim());
  }, [paymentCode]);

  const isPixCode = useMemo(() => {
    return (
      /^000201/i.test(paymentCode.trim()) ||
      /br\.gov\.bcb\.pix/i.test(paymentCode.trim())
    );
  }, [paymentCode]);

  const linhaDigitavelFormatada = useMemo(() => {
    const digits = paymentCode.replace(/\D/g, '');
    if (digits.length === 47) {
      return `${digits.slice(0, 5)}.${digits.slice(5, 10)} ${digits.slice(10, 15)}.${digits.slice(15, 21)} ${digits.slice(21, 26)}.${digits.slice(26, 32)} ${digits.slice(32, 33)} ${digits.slice(33)}`;
    }
    if (digits.length === 48) {
      return `${digits.slice(0, 12)} ${digits.slice(12, 24)} ${digits.slice(24, 36)} ${digits.slice(36, 48)}`;
    }
    return paymentCode;
  }, [paymentCode]);

  /**
   * Consome o endpoint público de mensalidade para gerar/obter o boleto
   */
  const handleConsumePayment = useCallback(
    async (method: 'Boleto' | 'PIX' = 'Boleto') => {
      if (!token) {
        setError('Token de acesso da mensalidade não informado ou link inválido.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        setAlreadyGenerated(false);

        // MetodoPagamento no backend C#: PIX = 0, Boleto = 2
        const metodoValor = method === 'PIX' ? 0 : 2;

        const response = await fetch(
          `${apiV1Url()}/Pagamento/publico-solicitar-mensalidade/${token}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              accept: '*/*',
            },
            body: JSON.stringify({
              idMensalidade: 0,
              metodo: metodoValor,
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          let errMsg = '';
          try {
            const errJson = JSON.parse(errText);
            errMsg = errJson.message || errJson.erro || errJson.title || '';
          } catch {
            errMsg = errText;
          }

          if (response.status === 404) {
            setError('Fatura de assinatura não encontrada ou link expirado.');
            return;
          }

          if (
            /já foi gerado um pagamento/i.test(errMsg) ||
            /ja foi gerado/i.test(errMsg)
          ) {
            setAlreadyGenerated(true);
            return;
          }

          setError(errMsg || 'Não foi possível gerar o boleto desta assinatura.');
          return;
        }

        const rawText = await response.text();
        let jsonResponse: PaymentResponseData | null = null;
        let extractedCode = '';
        let extractedDueDate = '';

        try {
          jsonResponse = JSON.parse(rawText);
          if (jsonResponse && typeof jsonResponse === 'object') {
            extractedCode =
              (jsonResponse as any).codigo ||
              (jsonResponse as any).codigoPagamento ||
              (jsonResponse as any).pixEmv ||
              (jsonResponse as any).barcode ||
              (jsonResponse as any).bankSlipUrl ||
              '';
            extractedDueDate = (jsonResponse as any).dataVencimento || '';
          }
        } catch {
          // Resposta como string pura
          extractedCode = rawText.replace(/^"+|"+$/g, '').trim();
        }

        if (!extractedCode && typeof rawText === 'string') {
          extractedCode = rawText.replace(/^"+|"+$/g, '').trim();
        }

        setPaymentCode(extractedCode);
        if (extractedDueDate) {
          setDueDate(extractedDueDate);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Erro de conexão ao processar o boleto. Verifique sua internet.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    void handleConsumePayment('Boleto');
  }, [handleConsumePayment]);

  const handleCopyCode = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback manual se a API de clipboard falhar
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatDateDisplay = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 antialiased font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-slate-800 transition">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-lg leading-none block">
                PagWeb
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
                Assinaturas
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Pagamento Seguro
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl w-full mx-auto px-4 py-6 md:py-10 flex-1">
        {/* Loading State */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-7 h-7 text-slate-900 animate-spin" />
            </div>
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              Consumindo boleto da assinatura...
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Aguarde enquanto carregamos a sua fatura junto ao emissor bancário.
            </p>
          </div>
        ) : error ? (
          /* Error State */
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-200">
            <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">
              Não foi possível carregar a fatura
            </h2>
            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
              {error}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => void handleConsumePayment(activeMethod === 'pix' ? 'PIX' : 'Boleto')}
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition shadow-xs"
              >
                Tentar Novamente
              </button>
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition"
              >
                Ir para Início
              </Link>
            </div>
          </div>
        ) : alreadyGenerated ? (
          /* Already Generated Warning Card */
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-amber-200 space-y-5">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200/70 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-slate-900">
                Pagamento já solicitado para esta fatura
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Um boleto ou código de pagamento já foi emitido anteriormente para esta
                mensalidade. Caso já tenha realizado o pagamento no seu banco, a
                compensação ocorrerá em até <strong>3 dias úteis</strong>.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-w-md mx-auto text-xs text-slate-600 space-y-2">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span>
                  Verifique a sua caixa de entrada de e-mail com as orientações de pagamento
                  recebidas anteriormente.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => void handleConsumePayment('Boleto')}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition shadow-xs"
              >
                Atualizar Status
              </button>
            </div>
          </div>
        ) : (
          /* Payment Card Content */
          <div className="space-y-6">
            {/* Header Title Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md mb-2 uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5" />
                    Fatura de Assinatura
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 leading-tight">
                    Pagamento de Mensalidade
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Destinado a clientes e assinantes sem necessidade de login no sistema.
                  </p>
                </div>

                {dueDate && (
                  <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-100">
                    <span className="text-xs text-slate-500 block font-medium">Vencimento</span>
                    <span className="text-sm font-bold text-slate-900 flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 text-slate-600" />
                      {formatDateDisplay(dueDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Method Selector Tabs */}
              <div className="pt-5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2.5">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeMethod !== 'boleto') {
                        setActiveMethod('boleto');
                        void handleConsumePayment('Boleto');
                      }
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all border ${
                      activeMethod === 'boleto'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Boleto Bancário
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (activeMethod !== 'pix') {
                        setActiveMethod('pix');
                        void handleConsumePayment('PIX');
                      }
                    }}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all border ${
                      activeMethod === 'pix'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    Pix Instantâneo
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
              {/* BOLETO DETAILS */}
              {activeMethod === 'boleto' && (
                <div className="space-y-6">
                  {/* Se o código for uma URL de Boleto */}
                  {isUrl ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          Boleto Bancário Disponível
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Seu boleto foi emitido com sucesso e está pronto para visualização e impressão.
                        </p>
                      </div>

                      <div className="pt-2">
                        <a
                          href={paymentCode}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition shadow-xs w-full sm:w-auto"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Visualizar Boleto (PDF)
                        </a>
                      </div>
                    </div>
                  ) : paymentCode ? (
                    /* Linha Digitável / Código de Barras */
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                          Linha Digitável do Boleto
                        </label>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-sm sm:text-base font-semibold text-slate-900 text-center select-all break-all tracking-wide">
                          {linhaDigitavelFormatada}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(paymentCode)}
                          className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-xs ${
                            copied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4" />
                              Código Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copiar Linha Digitável
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handlePrint}
                          className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition"
                          title="Imprimir instruções"
                        >
                          <Printer className="w-4 h-4" />
                          Imprimir
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      Nenhum código de boleto retornado pelo emissor.
                    </div>
                  )}

                  {/* Instruções de Pagamento do Boleto */}
                  <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 text-xs text-slate-600 space-y-2">
                    <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Info className="w-4 h-4 text-slate-600" />
                      Como pagar este boleto?
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-0.5">
                      <li>Abra o aplicativo do seu banco ou internet banking no celular ou computador.</li>
                      <li>Escolha a opção de pagamento de contas ou boletos bancários.</li>
                      <li>Cole a linha digitável copiada acima ou faça o escaneamento.</li>
                      <li>Confirme o valor e conclua o pagamento.</li>
                    </ol>
                    <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      * O prazo de compensação bancária é de 1 a 3 dias úteis após a liquidação.
                    </p>
                  </div>
                </div>
              )}

              {/* PIX DETAILS */}
              {activeMethod === 'pix' && (
                <div className="space-y-6">
                  {paymentCode ? (
                    <div className="flex flex-col items-center text-center space-y-5">
                      {isPixCode && (
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs inline-block">
                          <QRCodeSVG
                            value={paymentCode}
                            size={200}
                            level="M"
                            className="rounded-lg"
                          />
                        </div>
                      )}

                      <div className="w-full text-left space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                          Chave Pix Copia e Cola
                        </label>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 break-all max-h-24 overflow-y-auto select-all">
                          {paymentCode}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(paymentCode)}
                        className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-xs ${
                          copied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Código Pix Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copiar Código Pix
                          </>
                        )}
                      </button>

                      <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-800 text-left w-full flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          O pagamento via Pix é compensado instantaneamente e ativa sua
                          assinatura em poucos segundos.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      Código Pix não disponível para esta cobrança.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Support and Security Note */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Ambiente criptografado e certificado • PagWeb Intermediações</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 mt-8">
        <div className="max-w-2xl mx-auto text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Processamento seguro de faturas de assinaturas</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} PagWeb • Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};
