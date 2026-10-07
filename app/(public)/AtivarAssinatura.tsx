import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Upload,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { apiV1Url } from '../../utils/apiOrigin';

const BASE_URL = apiV1Url();

export const AtivarAssinatura: React.FC = () => {
  const { token: routeToken } = useParams<{ token?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Extrai o token de acesso de qualquer formato de rota ou query string
  const token = useMemo(() => {
    if (routeToken) {
      const clean = routeToken.replace(/^tokenAcesso=/i, '').trim();
      if (clean) return clean;
    }

    const queryToken = searchParams.get('tokenAcesso') || searchParams.get('token');
    if (queryToken?.trim()) return queryToken.trim();

    // Fallback via regex no hash completo da URL
    const fullHash = window.location.hash || location.pathname;
    const matchTokenAcesso = fullHash.match(/tokenAcesso=([a-f0-9-]+)/i);
    if (matchTokenAcesso?.[1]) return matchTokenAcesso[1];

    const matchGuid = fullHash.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (matchGuid?.[1]) return matchGuid[1];

    return '';
  }, [routeToken, searchParams, location]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDetails, setSuccessDetails] = useState<string | null>(null);
  const [contratoFile, setContratoFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContratoFile(e.target.files[0]);
    }
  };

  const handleAtivarAssinatura = async () => {
    if (!token) {
      setError('Token de ativação da assinatura não identificado na URL.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Prepara payload via FormData (aceito pelo endpoint UpdateMinhaAssinatura no C#)
      const formData = new FormData();
      formData.append('TokenAcesso', token);
      formData.append('Status', '0'); // AssinaturaStatus.Ativo = 0
      if (contratoFile) {
        formData.append('Contrato', contratoFile);
      }

      let response = await fetch(`${BASE_URL}/Assinatura/minha-assinatura/${token}`, {
        method: 'PATCH',
        headers: {
          accept: '*/*',
        },
        body: formData,
      });

      // Fallback para JSON caso a controller não aceite multipart
      if (!response.ok && response.status === 415) {
        response = await fetch(`${BASE_URL}/Assinatura/minha-assinatura/${token}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            accept: '*/*',
          },
          body: JSON.stringify({
            tokenAcesso: token,
            status: 0,
          }),
        });
      }

      const responseText = await response.text();
      let responseJson: any = null;
      try {
        responseJson = JSON.parse(responseText);
      } catch {
        // texto puro
      }

      if (!response.ok) {
        const errorMsg =
          responseJson?.message ||
          responseJson?.error ||
          responseText ||
          'Falha ao ativar a assinatura. O link pode ser inválido ou já ter sido utilizado.';

        // Caso já esteja ativa
        if (errorMsg.includes('já está definido') || errorMsg.includes('já está ativo')) {
          setIsSuccess(true);
          setSuccessDetails('Esta assinatura já se encontra ativada.');
          return;
        }

        throw new Error(errorMsg);
      }

      setIsSuccess(true);
      setSuccessDetails(responseJson?.message || 'Status da assinatura atualizado com sucesso.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao ativar assinatura.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-800 antialiased font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">PagWeb</span>
          </Link>
          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Ativação Segura
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-xl w-full mx-auto px-4 py-8 md:py-14 flex-1">
        {isSuccess ? (
          <div className="bg-white rounded-2xl p-8 md:p-10 text-center shadow-sm border border-emerald-200 space-y-6">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Assinatura Ativada!
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                {successDetails ||
                  'Sua assinatura foi ativada com sucesso. Os benefícios do seu plano já estão disponíveis e suas mensalidades foram geradas.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-left space-y-1.5">
              <p className="font-semibold text-slate-700">O que acontece agora?</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Você receberá lembretes e links de fatura via WhatsApp e E-mail.</li>
                <li>Pode acessar o sistema a qualquer momento com sua conta PagWeb.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full inline-flex items-center justify-center px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition shadow-xs"
              >
                Acessar Minha Conta
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 md:p-9 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                  Convite de Adesão
                </span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Ativar Minha Assinatura
                </h1>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Você recebeu este link oficial para autorizar e ativar seu plano recorrente no
              sistema. Clique no botão abaixo para confirmar sua adesão.
            </p>

            {/* Token Badge */}
            {token ? (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Identificador da Proposta:</span>
                <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold truncate max-w-[200px]">
                  {token}
                </code>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
                Nenhum código de proposta identificado no endereço acessado.
              </div>
            )}

            {/* Upload de Contrato opcional */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Contrato Assinado (opcional):
              </label>
              <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-slate-400 transition bg-slate-50/50">
                <input
                  type="file"
                  id="contratoUpload"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <label
                  htmlFor="contratoUpload"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-700">
                    {contratoFile ? contratoFile.name : 'Clique para anexar arquivo (PDF ou imagem)'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Se a empresa solicitou o envio do contrato assinado
                  </span>
                </label>
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">{error}</p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAtivarAssinatura}
              disabled={isLoading || !token}
              className="w-full inline-flex items-center justify-center px-5 py-3.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition shadow-xs text-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Ativando Assinatura...
                </>
              ) : (
                <>
                  Confirmar e Ativar Assinatura
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>

            <div className="pt-2 text-center text-xs text-slate-500">
              Caso tenha dúvidas sobre este plano, entre em contato diretamente com o
              estabelecimento emissor.
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        © 2026 PagWeb. Plataforma de pagamentos e assinaturas seguras.
      </footer>
    </div>
  );
};
