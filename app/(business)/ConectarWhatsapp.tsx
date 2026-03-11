import React from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { MessageCircle, QrCode, CheckCircle2, Smartphone, Info } from 'lucide-react';

export const ConectarWhatsapp: React.FC = () => {
  return (
    <BusinessLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-8 h-8 text-green-600" />
          WhatsApp
        </h1>
        <p className="text-gray-500 mt-1">Conecte seu WhatsApp para automatizar o envio de cobranças e notificações.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* QR Code Section */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200 mb-6 w-full flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
               <img 
                 src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PagWeb-WhatsApp-Auth-Demo" 
                 alt="QR Code WhatsApp" 
                 className="w-48 h-48"
               />
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600 font-medium animate-pulse">
                <QrCode className="w-4 h-4" />
                <span>Aguardando conexão...</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">O código QR é atualizado automaticamente a cada 30 segundos.</p>
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
