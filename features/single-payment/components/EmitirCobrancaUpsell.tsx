import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, Send, X, QrCode, Barcode, BellRing } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface EmitirCobrancaUpsellDialogProps {
  /**
   * Só quem tem `user.tipo === 'Empresa'` passa pelo BusinessRoute (App.tsx);
   * qualquer outro é devolvido para /dashboard. O destino segue esse critério
   * para não mandar ninguém a uma rota que o expulsa.
   */
  canReachBusinessPanel: boolean;
  onClose: () => void;
}

const BENEFITS = [
  { icon: QrCode, text: 'Receber por PIX, com QR Code e código copia e cola' },
  { icon: Barcode, text: 'Emitir boleto bancário para os seus clientes' },
  { icon: BellRing, text: 'Régua de cobrança automática por e-mail e WhatsApp' },
] as const;

/**
 * Atalho contextual: o cliente está olhando cobranças que recebeu e quer emitir
 * uma. Em vez de esconder a ação (que não ensina nada) ou parar num aviso (que
 * não leva a lugar nenhum), explica a condição e entrega o próximo passo.
 */
export const EmitirCobrancaUpsellDialog: React.FC<EmitirCobrancaUpsellDialogProps> = ({
  canReachBusinessPanel,
  onClose,
}) => {
  const navigate = useNavigate();

  const handlePrimaryAction = () => {
    onClose();
    navigate(canReachBusinessPanel ? '/business/pagamento-unico' : '/tornar-estabelecimento');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="emitir-cobranca-upsell-title"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-[5px] bg-violet-50 text-violet-600 border border-violet-100">
              <Rocket className="w-5 h-5" />
            </span>
            <h2 id="emitir-cobranca-upsell-title" className="text-lg font-bold text-gray-900">
              {canReachBusinessPanel ? 'Emitir cobrança' : 'Emitir cobrança é de estabelecimento'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600">
          {canReachBusinessPanel
            ? 'Você já tem um estabelecimento. A emissão de cobranças fica no painel do estabelecimento.'
            : 'Nesta tela você paga as cobranças que recebe. Para enviar cobranças aos seus próprios clientes, sua conta precisa virar um estabelecimento.'}
        </p>

        {!canReachBusinessPanel && (
          <ul className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
            {BENEFITS.map(({ icon: BenefitIcon, text }) => (
              <li key={text} className="flex items-start gap-2 text-sm text-gray-700">
                <BenefitIcon className="w-4 h-4 mt-0.5 text-violet-600 shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Agora não
          </Button>
          <Button
            type="button"
            onClick={handlePrimaryAction}
            className="flex-1 bg-violet-600 hover:bg-violet-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {canReachBusinessPanel ? 'Ir para o painel' : 'Quero emitir cobranças'}
          </Button>
        </div>
      </div>
    </div>
  );
};
