import React, { useState, useEffect, useCallback } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { MessageCircle, QrCode, CheckCircle2, Smartphone, Info, Loader2, RefreshCw, LogOut } from 'lucide-react';
import { businessService } from '../../services/businessService';
import { useToast } from '../../context/ToastContext';
import { QRCodeSVG } from 'qrcode.react';

export const ConectarWhatsapp: React.FC = () => {
  const { addToast } = useToast();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isInstanceCreated, setIsInstanceCreated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const REFRESH_INTERVAL = 40;
  const MAX_REFRESHES = 4;

  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const instance = await businessService.checkWhatsAppInstance();
        if (instance) {
          setIsInstanceCreated(true);
          if (instance.status === 'open' || instance.status === 'connected') {
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar instância inicial", error);
      }
    };
    checkInitialStatus();
  }, []);

  // Polling effect while QR code is active
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const instance = await businessService.checkWhatsAppInstance();
        if (instance && (instance.status === 'open' || instance.status === 'connected')) {
          setIsConnected(true);
          setQrCode(null);
          setTimeLeft(0);
          addToast('success', 'Conectado', 'WhatsApp conectado com sucesso!');
        }
      } catch (error) {
        console.error("Erro ao verificar status", error);
      }
    };

    if (qrCode && !isConnected) {
      pollInterval = setInterval(checkStatus, 3000); // Poll every 3 seconds
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [qrCode, isConnected, addToast]);

  const handleCreateInstance = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Check if instance exists
      const instance = await businessService.checkWhatsAppInstance();
      
      let qrCodeData;
      if (!instance) {
        // 2a. If no instance, create one
        qrCodeData = await businessService.createWhatsAppInstance();
        setIsInstanceCreated(true);
      } else {
        // 2b. If instance exists, just get the QR code
        setIsInstanceCreated(true);
        qrCodeData = await businessService.getWhatsAppQRCode();
      }

      setQrCode(qrCodeData.qrCode);
      setTimeLeft(REFRESH_INTERVAL);
      setRefreshCount(0);
      addToast('success', 'Sucesso', 'QR Code gerado! Escaneie para conectar.');
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Erro ao gerar QR Code do WhatsApp');
      setQrCode(null);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const handleRefreshQRCode = useCallback(async () => {
    setLoading(true);
    try {
      const data = await businessService.getWhatsAppQRCode();
      setQrCode(data.qrCode);
      setTimeLeft(REFRESH_INTERVAL);
      addToast('success', 'Atualizado', 'QR Code atualizado automaticamente.');
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Erro ao atualizar QR Code');
      // If refresh fails, maybe we should try to recreate instance?
      handleCreateInstance();
    } finally {
      setLoading(false);
    }
  }, [addToast, handleCreateInstance]);

  useEffect(() => {
    if (!qrCode || loading) return;

    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    } else {
      // Time is up
      if (refreshCount < MAX_REFRESHES) {
        setRefreshCount(prev => prev + 1);
        handleRefreshQRCode();
      } else {
        addToast('success', 'Aviso', 'Limite de atualizações atingido. Criando nova instância...');
        handleCreateInstance();
      }
    }
    return () => clearTimeout(timer);
  }, [timeLeft, qrCode, loading, refreshCount, handleRefreshQRCode, handleCreateInstance, addToast]);

  const handleDisconnect = async () => {
    if (!window.confirm('Tem certeza que deseja desconectar o WhatsApp?')) return;
    
    setLoading(true);
    try {
      await businessService.disconnectWhatsApp();
      setQrCode(null);
      setTimeLeft(0);
      setRefreshCount(0);
      setIsInstanceCreated(false);
      setIsConnected(false);
      addToast('success', 'Desconectado', 'WhatsApp desconectado com sucesso.');
    } catch (error: any) {
      addToast('error', 'Erro', error.message || 'Erro ao desconectar WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BusinessLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-8 h-8 text-green-600" />
            WhatsApp
          </h1>
          <p className="text-gray-500 mt-1">Conecte seu WhatsApp para automatizar o envio de cobranças e notificações.</p>
        </div>
        
        {isInstanceCreated && (
          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm disabled:opacity-50"
          >
            <LogOut size={16} />
            Desconectar Instância
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* QR Code Section */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
          {isConnected ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">WhatsApp Conectado</h2>
              <p className="text-gray-500 text-sm max-w-[250px]">
                Seu número está vinculado e pronto para enviar notificações automáticas.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 mb-6 w-full flex flex-col items-center relative overflow-hidden">
                
                <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 transition-all duration-500 w-full flex justify-center ${!qrCode ? 'blur-md grayscale' : ''}`}>
                   {qrCode ? (
                     <QRCodeSVG 
                       value={qrCode} 
                       size={300}
                       style={{ width: "100%", height: "auto", maxWidth: "300px" }}
                       level="H"
                       includeMargin={false}
                     />
                   ) : (
                     <div className="w-full aspect-square max-w-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
                        <QrCode className="w-24 h-24 text-gray-200" />
                     </div>
                   )}
                </div>

                {!qrCode ? (
                  <button
                    onClick={handleCreateInstance}
                    disabled={loading}
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 hover:bg-white/60 transition-colors group"
                  >
                    <div className="bg-green-600 text-white p-4 rounded-full shadow-lg group-hover:scale-110 transition-transform mb-3">
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <RefreshCw className="w-6 h-6" />}
                    </div>
                    <span className="font-bold text-gray-900 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                      {loading ? 'Criando instância...' : 'Gerar QR Code'}
                    </span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-green-600 font-bold">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>QR Code Ativo</span>
                    </div>
                    <div className="text-xs text-gray-500 font-medium flex flex-col items-center gap-1">
                      <div>Expira em: <span className="text-slate-900 font-bold">{timeLeft}s</span></div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Ciclo: <span className="font-bold">{refreshCount + 1} de {MAX_REFRESHES + 1}</span>
                      </div>
                    </div>
                    <button 
                      onClick={handleRefreshQRCode}
                      disabled={loading}
                      className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                      Atualizar agora
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {qrCode ? 'Aponte a câmera do seu celular para o código acima.' : 'Clique no botão acima para iniciar uma nova conexão.'}
              </p>
            </>
          )}
        </div>

        {/* Instructions Section */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-slate-400" />
            Como conectar?
          </h2>
          
          <div className="space-y-8">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 font-bold">1</div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Abra o WhatsApp</h3>
                <p className="text-gray-500 mt-1">No seu celular, abra o aplicativo do WhatsApp que deseja vincular ao sistema.</p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 font-bold">2</div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Acesse os Aparelhos Conectados</h3>
                <p className="text-gray-500 mt-1">
                  Toque em <span className="font-semibold">Configurações</span> ou <span className="font-semibold">Menu</span> e selecione <span className="font-semibold">Aparelhos conectados</span>.
                </p>
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 font-bold">3</div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Escaneie o QR Code</h3>
                <p className="text-gray-500 mt-1">
                  Toque em <span className="font-semibold text-green-600">Conectar um aparelho</span> e aponte a câmera do seu celular para o código ao lado.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Importante:</p>
              <p>Mantenha seu celular conectado à internet. Se você desconectar o aparelho no WhatsApp, o sistema parará de enviar as notificações.</p>
            </div>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
};
