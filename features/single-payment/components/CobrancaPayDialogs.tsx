import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { SearchSelect } from '../../../components/ui/SearchSelect';
import { CheckCircle2, Copy, X } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import {
  Cobranca,
  MetodoPagamento,
  MetodoPagamentoEnum,
  PagamentoUnicoResponse,
} from '../schemas/cobrancaSchemas';

const METODO_OPTIONS: Array<{ value: MetodoPagamento; label: string }> = [
  { value: 'PIX', label: 'PIX' },
  { value: 'PixCaixa', label: 'PIX na caixa' },
  { value: 'Boleto', label: 'Boleto bancário' },
  { value: 'BoletoPix', label: 'Boleto + PIX' },
  { value: 'Cartao', label: 'Cartão de crédito' },
  { value: 'Transferencia', label: 'Transferência bancária' },
  { value: 'Dinheiro', label: 'Dinheiro' },
];

interface PaymentResultModalProps {
  result: PagamentoUnicoResponse;
  onClose: () => void;
}

export const PaymentResultModal: React.FC<PaymentResultModalProps> = ({
  result,
  onClose,
}) => {
  const { addToast } = useToast();
  const paymentCode =
    result.pixEmv ?? result.barcode ?? result.digitableLine ?? result.bankSlipUrl ?? null;

  const handleCopy = () => {
    if (!paymentCode) return;
    navigator.clipboard
      .writeText(paymentCode)
      .then(() => addToast('success', 'Copiado!', 'Código copiado para a área de transferência.'))
      .catch(() => addToast('error', 'Erro', 'Não foi possível copiar o código.'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">Pagamento iniciado</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500">
          Use o código abaixo para concluir o pagamento no seu aplicativo bancário.
        </p>

        {paymentCode ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
              {result.pixEmv ? 'Código PIX' : 'Código do boleto'}
            </p>
            <p className="text-xs text-gray-700 break-all font-mono leading-relaxed">{paymentCode}</p>
            <Button type="button" onClick={handleCopy} className="w-full bg-violet-600 hover:bg-violet-700 text-sm">
              <Copy className="w-4 h-4 mr-2" />
              Copiar código
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">
            Pagamento registrado. Acompanhe o status em sua conta.
          </p>
        )}

        {result.bankSlipUrl && (
          <a
            href={result.bankSlipUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-sm text-violet-700 underline"
          >
            Abrir boleto em nova aba
          </a>
        )}

        <Button type="button" onClick={onClose} className="w-full bg-slate-900 hover:bg-slate-800">
          Fechar
        </Button>
      </div>
    </div>
  );
};

interface PayDialogProps {
  cobranca: Cobranca;
  onPay: (metodo: MetodoPagamento) => Promise<void>;
  onClose: () => void;
  isPaying: boolean;
}

export const PayCobrancaDialog: React.FC<PayDialogProps> = ({
  cobranca,
  onPay,
  onClose,
  isPaying,
}) => {
  const [metodo, setMetodo] = useState<string | number>('PIX');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold text-gray-900">Pagar cobrança</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
          <p className="font-medium text-gray-800">{cobranca.descricao}</p>
          <p className="text-violet-700 font-bold mt-1">
            R$ {cobranca.valorTotal.toFixed(2).replace('.', ',')}
          </p>
          {cobranca.observacao && (
            <p className="text-xs text-gray-500 mt-1">{cobranca.observacao}</p>
          )}
        </div>

        <SearchSelect
          label="Método de pagamento"
          options={METODO_OPTIONS}
          value={metodo}
          onChange={setMetodo}
          placeholder="Selecione o método..."
        />

        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            isLoading={isPaying}
            onClick={() => {
              const parsed = MetodoPagamentoEnum.safeParse(metodo);
              if (!parsed.success) return;
              void onPay(parsed.data);
            }}
            className="flex-1 bg-violet-600 hover:bg-violet-700"
            disabled={!metodo}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
};
