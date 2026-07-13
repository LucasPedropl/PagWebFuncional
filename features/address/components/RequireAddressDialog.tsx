import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import {
  EnderecoInput,
  EnderecoInputSchema,
  emptyEndereco,
} from '../schemas/enderecoSchemas';
import { enderecoService } from '../services/enderecoService';
import { EnderecoFormFields } from './EnderecoFormFields';

interface RequireAddressDialogProps {
  onResolved: () => void;
  onCancel: () => void;
}

/**
 * Modal bloqueante: exige endereço residencial do cliente antes do pagamento Bixs.
 */
export const RequireAddressDialog: React.FC<RequireAddressDialogProps> = ({
  onResolved,
  onCancel,
}) => {
  const [form, setForm] = useState<EnderecoInput>(emptyEndereco());
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setError(null);
    const parsed = EnderecoInputSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Preencha todos os campos.');
      return;
    }
    setIsSaving(true);
    try {
      await enderecoService.createForUser(parsed.data);
      onResolved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar endereço';
      console.error('[RequireAddressDialog]', err);
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Endereço obrigatório</h2>
              <p className="text-sm text-gray-500 mt-1">
                Para processar o pagamento, cadastre seu endereço de residência.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <EnderecoFormFields
          value={form}
          onChange={setForm}
          disabled={isSaving}
          title=""
        />

        {error ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        ) : null}

        <div className="flex gap-3 pt-1">
          <Button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            isLoading={isSaving}
            onClick={() => void handleSave()}
            className="flex-1 bg-violet-600 hover:bg-violet-700"
          >
            Salvar e continuar
          </Button>
        </div>
      </div>
    </div>
  );
};
