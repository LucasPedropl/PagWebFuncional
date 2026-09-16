import React from 'react';
import { MapPin, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { AddressScope } from '../services/enderecoService';
import { useAddressForm } from '../hooks/useAddressForm';
import { EnderecoFormFields } from './EnderecoFormFields';

interface AddressSettingsPanelProps {
  scope: AddressScope;
  title?: string;
  subtitle?: string;
}

/** Painel de cadastro/edição de endereço em Configurações. */
export const AddressSettingsPanel: React.FC<AddressSettingsPanelProps> = ({
  scope,
  title = 'Endereço',
  subtitle,
}) => {
  const { form, setForm, isSaving, isDirty, persistence, save } = useAddressForm(scope);
  const missingServerId = !persistence.serverAddressId;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-slate-500" />
          {title}
        </h2>
        {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
        {missingServerId && (persistence.hasLocalDraft || persistence.persistedOnServer) ? (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
            Rascunho neste dispositivo. Sem o identificador do endereço, o servidor recusa a
            edição (cadastro 1:1). O que você salvar agora só fica neste navegador.
          </p>
        ) : null}
        {persistence.persistedOnServer && persistence.serverAddressId ? (
          <p className="text-xs text-emerald-800 mt-3">Endereço vinculado a este dispositivo.</p>
        ) : null}
      </div>

      <EnderecoFormFields value={form} onChange={setForm} disabled={isSaving} title="" />

      <div className="pt-2 flex items-center gap-3">
        <Button onClick={() => void save()} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          Salvar endereço
        </Button>
        {isDirty ? (
          <span className="text-xs text-slate-500">Alterações ainda não confirmadas no servidor.</span>
        ) : null}
      </div>
    </div>
  );
};
