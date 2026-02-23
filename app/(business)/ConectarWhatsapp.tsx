import React from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { MessageCircle, QrCode, CheckCircle2 } from 'lucide-react';

export const ConectarWhatsapp: React.FC = () => {
  return (
    <BusinessLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-8 h-8 text-green-600" />
          Conectar WhatsApp
        </h1>
        <p className="text-gray-500 mt-1">Vincule seu número para enviar notificações automáticas aos clientes.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          
          {/* Instructions */}
          <div className="flex-1 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <QrCode className="w-6 h-6 text-gray-400" />
                Instruções de Conexão
              </h2>
              
              <ol className="space-y-6">
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold text-sm">1</span>
                  <div>
                    <p className="font-medium text-gray-900">Abra o WhatsApp no seu celular</p>
                    <p className="text-sm text-gray-500 mt-1">Certifique-se de que está com a versão mais recente instalada.</p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold text-sm">2</span>
                  <div>
                    <p className="font-medium text-gray-900">Acesse o menu de dispositivos</p>
                    <p className="text-sm text-gray-500 mt-1">
                      No Android: Toque em <strong>Mais opções</strong> (três pontos) {'>'} <strong>Aparelhos conectados</strong>.<br/>
                      No iPhone: Vá em <strong>Configurações</strong> {'>'} <strong>Aparelhos conectados</strong>.
                    </p>
                  </div>
                </li>
                
                <li className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 font-bold text-sm">3</span>
                  <div>
                    <p className="font-medium text-gray-900">Conecte um novo aparelho</p>
                    <p className="text-sm text-gray-500 mt-1">Toque em <strong>Conectar um aparelho</strong> e aponte a câmera para a tela.</p>
                  </div>
                </li>
              </ol>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Mantenha seu celular conectado à internet para que o sistema possa enviar mensagens.
              </p>
            </div>
          </div>

          {/* QR Code Area */}
          <div className="flex flex-col items-center justify-center bg-gray-50 p-8 rounded-2xl border-2 border-dashed border-gray-200 min-w-[300px]">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4">
               {/* Placeholder QR Code */}
               <img 
                 src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PagWeb-Connect-Whatsapp-Demo" 
                 alt="QR Code WhatsApp" 
                 className="w-48 h-48"
               />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 animate-pulse">
                <QrCode className="w-4 h-4" />
                <span>Aguardando leitura do código...</span>
            </div>
          </div>

        </div>
      </div>
    </BusinessLayout>
  );
};
