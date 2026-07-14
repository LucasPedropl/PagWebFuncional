import React, { useState } from 'react';
import { MapPin, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../context/ToastContext';
import {
  EnderecoInput,
  EnderecoInputSchema,
} from '../schemas/enderecoSchemas';
import { enderecoService } from '../services/enderecoService';
import { EnderecoFormFields } from './EnderecoFormFields';

interface AddressSettingsPanelProps {
  scope: 'client' | 'empresa';
  title?: string;
  subtitle?: string;
}

/** Painel de cadastro/edição de endereço em Configurações. */
export const AddressSettingsPanel: React.FC<AddressSettingsPanelProps> = ({
  scope,
  title = 'Endereço',
  subtitle,
}) => {
  const { addToast } = useToast();
  const [form, setForm] = useState<EnderecoInput>(() => enderecoService.getDraft(scope));
  const [isSaving, setIsSaving] = useState(false);
  const hasId = Boolean(enderecoService.getStoredAddressId(scope));

  const handleSave = async () => {
    const parsed = EnderecoInputSchema.safeParse(form);
    if (!parsed.success) {
      addToast('error', 'Erro', parsed.error.issues[0]?.message ?? 'Preencha o endereço.');
      return;
    }
    setIsSaving(true);
    try {
      await enderecoService.saveForScope(scope, parsed.data);
      addToast(
        'success',
        'Sucesso',
        hasId || enderecoService.getStoredAddressId(scope)
          ? 'Endereço atualizado.'
          : 'Endereço cadastrado.',
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar endereço';
      console.error('[AddressSettingsPanel]', err);
      addToast('error', 'Erro', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-slate-500" />
          {title}
        </h2>
        {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
        {!hasId && (scope === 'client' ? enderecoService.hasClientAddressFlag() : enderecoService.hasEmpresaAddressFlag()) ? (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
            Endereço já cadastrado. A API não devolve o ID no create — a primeira edição via PATCH
            gravará o ID localmente para próximas atualizações.
          </p>
        ) : null}
      </div>

      <EnderecoFormFields value={form} onChange={setForm} disabled={isSaving} title="" />

      <div className="pt-2">
        <Button onClick={() => void handleSave()} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Salvar endereço
        </Button>
      </div>
    </div>
  );
};
