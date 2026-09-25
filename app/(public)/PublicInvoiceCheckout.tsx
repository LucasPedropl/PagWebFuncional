import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  CreditCard,
  QrCode,
  FileText,
  Copy,
  Check,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface PublicInvoiceItem {
  id?: number;
  nome: string;
  preco: number;
}

interface PublicInvoiceData {
  id?: number;
  publicToken: string;
  valorTotal: number;
  descricao: string;
  observacao?: string;
  dataVencimento: string;
  status: string; // 'Aberto' | 'Pago' | 'Atrasado' | 'Cancelado'
  empresa: {
    nome: string;
    cnpj?: string;
    logo?: string | null;
  };
  usuario?: {
    nome: string;
  };
  produtos?: PublicInvoiceItem[];
  servicos?: PublicInvoiceItem[];
  codigoPix?: string;
  linhaDigitavel?: string;
  urlBoleto?: string;
}

const BASE_URL = 'https://lojas.vlks.com.br/api/v1';

export const PublicInvoiceCheckout: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [invoice, setInvoice] = useState<PublicInvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Metodo de pagamento
  const [activeTab, setActiveTab] = useState<'pix' | 'boleto'>('pix');
  const [isGeneratingPayment, setIsGeneratingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Dados gerados
  const [pixCode, setPixCode] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [boletoUrl, setBoletoUrl] = useState<string>('');
  const [copiedType, setCopiedType] = useState<'pix' | 'boleto' | null>(null);

  // Endereço para Boleto
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const fetchInvoice = useCallback(async () => {
    if (!token) {
      setError('Identificador da fatura não informado.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`${BASE_URL}/Cobranca/publico/${token}`, {
        headers: { accept: '*/*' },
      });

      if (!res.ok) {
        if (res.status === 404) {
          setError('Fatura não encontrada ou link expirado.');
        } else {
          setError('Não foi possível carregar as informações desta cobrança.');
        }
        return;
      }

      const data: PublicInvoiceData = await res.json();
      setInvoice(data);
      if (data.codigoPix) setPixCode(data.codigoPix);
      if (data.linhaDigitavel) setBarcode(data.linhaDigitavel);
      if (data.urlBoleto) setBoletoUrl(data.urlBoleto);
    } catch {
      setError('Erro de conexão ao carregar a fatura. Verifique sua internet.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void fetchInvoice();
  }, [fetchInvoice]);

  const handleGeneratePix = async () => {
    if (!token) return;
    try {
      setIsGeneratingPayment(true);
      setPaymentError(null);
      const res = await fetch(`${BASE_URL}/Pagamento/publico/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({ metodo: 'PIX' }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar o código Pix. Tente novamente.');
      }

      const raw = await res.text();
      let code = raw.replace(/^"+|"+$/g, '').trim();
      try {
        const json = JSON.parse(raw);
        code = json.pixEmv || json.codigoPagamento || code;
      } catch {
        // mantem raw
      }
      setPixCode(code);
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Erro ao gerar Pix.');
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const handleGenerateBoleto = async () => {
    if (!token) return;
    try {
      setIsGeneratingPayment(true);
      setPaymentError(null);
      const res = await fetch(`${BASE_URL}/Pagamento/publico/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: '*/*',
        },
        body: JSON.stringify({
          metodo: 'Boleto',
          endereco: {
            cep: cep.replace(/\D/g, ''),
            logradouro,
            numero,
            bairro,
            cidade,
            estado,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar o boleto bancário.');
      }

      const data = await res.json();
      setBarcode(data.linhaDigitavel || data.barcode || '');
      setBoletoUrl(data.bankSlipUrl || data.urlBoleto || '');
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Erro ao gerar boleto.');
    } finally {
      setIsGeneratingPayment(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'pix' | 'boleto') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      // Fallback
    }
  };

  const formatBRL = (val?: number) => {
    if (val == null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleDateString('pt-BR');
    } catch {
      return isoString;
    }
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
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
            Checkout Seguro
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl w-full mx-auto px-4 py-6 md:py-10 flex-1">
        {isLoading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-200">
            <Loader2 className="w-8 h-8 text-slate-900 animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-slate-600">Carregando detalhes da fatura...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-red-200">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Não foi possível carregar a fatura</h2>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <button
              onClick={() => void fetchInvoice()}
              className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition"
            >
              Tentar Novamente
            </button>
          </div>
        ) : invoice ? (
          <div className="space-y-6">
            {/* Invoice Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {invoice.empresa?.logo ? (
                    <img
                      src={invoice.empresa.logo}
                      alt={invoice.empresa.nome}
                      className="w-12 h-12 rounded-xl object-contain border border-slate-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h1 className="font-bold text-slate-900 text-lg leading-tight">
                      {invoice.empresa?.nome || 'Estabelecimento'}
                    </h1>
                    {invoice.empresa?.cnpj && (
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        CNPJ: {invoice.empresa.cnpj}
                      </p>
                    )}
                  </div>
                </div>

                {invoice.status === 'Pago' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Pago
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Aguardando Pagamento
                  </span>
                )}
              </div>

              {/* Amount Display */}
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">
                    Valor a Pagar
                  </span>
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {formatBRL(invoice.valorTotal)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Vencimento: {formatDate(invoice.dataVencimento)}</span>
                </div>
              </div>

              {/* Description */}
              {invoice.descricao && (
                <div className="mt-4 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Descrição: </span>
                  {invoice.descricao}
                </div>
              )}

              {/* Items Breakdown */}
              {((invoice.produtos && invoice.produtos.length > 0) ||
                (invoice.servicos && invoice.servicos.length > 0)) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Itens Inclusos
                  </h3>
                  <div className="space-y-1.5 text-sm">
                    {invoice.produtos?.map((p, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>{p.nome}</span>
                        <span className="font-medium text-slate-900">{formatBRL(p.preco)}</span>
                      </div>
                    ))}
                    {invoice.servicos?.map((s, idx) => (
                      <div key={idx} className="flex justify-between text-slate-600">
                        <span>{s.nome}</span>
                        <span className="font-medium text-slate-900">{formatBRL(s.preco)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Options (If not already paid) */}
            {invoice.status === 'Pago' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-emerald-950 mb-1">Pagamento Confirmado!</h2>
                <p className="text-sm text-emerald-800">
                  Esta fatura foi quitada com sucesso. Nenhuma ação adicional é necessária.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pix')}
                    className={`flex-1 py-3.5 px-4 text-center text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
                      activeTab === 'pix'
                        ? 'border-slate-900 text-slate-900 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    PIX (Aprovação Imediata)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('boleto')}
                    className={`flex-1 py-3.5 px-4 text-center text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
                      activeTab === 'boleto'
                        ? 'border-slate-900 text-slate-900 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Boleto Bancário
                  </button>
                </div>

                <div className="p-6">
                  {paymentError && (
                    <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{paymentError}</span>
                    </div>
                  )}

                  {/* PIX TAB */}
                  {activeTab === 'pix' && (
                    <div className="text-center space-y-4">
                      {pixCode ? (
                        <>
                          <div className="p-4 bg-white border-2 border-slate-100 rounded-2xl inline-block shadow-xs">
                            <QRCodeSVG value={pixCode} size={200} level="M" />
                          </div>

                          <div className="text-xs text-slate-500">
                            Abra o app do seu banco e escaneie o QR Code ou copie o código abaixo:
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              readOnly
                              value={pixCode}
                              className="flex-1 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-600 select-all"
                            />
                            <button
                              type="button"
                              onClick={() => void copyToClipboard(pixCode, 'pix')}
                              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                            >
                              {copiedType === 'pix' ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  Copiar Pix
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="py-6">
                          <p className="text-sm text-slate-600 mb-4">
                            Pague com segurança via Pix com liberação imediata.
                          </p>
                          <button
                            type="button"
                            disabled={isGeneratingPayment}
                            onClick={() => void handleGeneratePix()}
                            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition inline-flex items-center justify-center gap-2"
                          >
                            {isGeneratingPayment ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Gerando QR Code...
                              </>
                            ) : (
                              <>
                                <QrCode className="w-4 h-4" />
                                Gerar QR Code Pix
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* BOLETO TAB */}
                  {activeTab === 'boleto' && (
                    <div className="space-y-4">
                      {barcode ? (
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <span className="text-xs text-slate-500 font-semibold block mb-1">
                              Linha Digitável do Boleto:
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900 break-all">
                                {barcode}
                              </span>
                              <button
                                type="button"
                                onClick={() => void copyToClipboard(barcode, 'boleto')}
                                className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg font-semibold shrink-0 flex items-center gap-1"
                              >
                                {copiedType === 'boleto' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedType === 'boleto' ? 'Copiado' : 'Copiar'}
                              </button>
                            </div>
                          </div>

                          {boletoUrl && (
                            <a
                              href={boletoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-300"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Visualizar / Imprimir Boleto em PDF
                            </a>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-500 mb-4">
                            Boletos bancários registrados exigem dados de endereço conforme regulação do Banco Central.
                          </p>
                          <div className="grid grid-cols-2 gap-3 mb-4 text-left">
                            <div className="col-span-2 sm:col-span-1">
                              <label className="text-xs font-semibold text-slate-700 block mb-1">CEP</label>
                              <input
                                type="text"
                                placeholder="00000-000"
                                value={cep}
                                onChange={(e) => setCep(e.target.value)}
                                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                              />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <label className="text-xs font-semibold text-slate-700 block mb-1">Número</label>
                              <input
                                type="text"
                                placeholder="123"
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="text-xs font-semibold text-slate-700 block mb-1">Logradouro / Rua</label>
                              <input
                                type="text"
                                placeholder="Rua das Flores"
                                value={logradouro}
                                onChange={(e) => setLogradouro(e.target.value)}
                                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">Bairro</label>
                              <input
                                type="text"
                                placeholder="Centro"
                                value={bairro}
                                onChange={(e) => setBairro(e.target.value)}
                                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-700 block mb-1">Cidade / UF</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="São Paulo"
                                  value={cidade}
                                  onChange={(e) => setCidade(e.target.value)}
                                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg outline-none"
                                />
                                <input
                                  type="text"
                                  placeholder="SP"
                                  maxLength={2}
                                  value={estado}
                                  onChange={(e) => setEstado(e.target.value.toUpperCase())}
                                  className="w-12 text-xs px-2 py-2 border border-slate-300 rounded-lg text-center uppercase outline-none"
                                />
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={isGeneratingPayment}
                            onClick={() => void handleGenerateBoleto()}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2"
                          >
                            {isGeneratingPayment ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Emitindo Boleto...
                              </>
                            ) : (
                              <>
                                <FileText className="w-4 h-4" />
                                Emitir Boleto Bancário
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        <p>Pagamento intermediado com segurança pela plataforma PagWeb.</p>
      </footer>
    </div>
  );
};
