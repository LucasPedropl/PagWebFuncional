import { useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import {
  AddressPersistenceState,
  EnderecoInput,
  EnderecoInputSchema,
  emptyEndereco,
} from '../schemas/enderecoSchemas';
import { AddressScope, enderecoService } from '../services/enderecoService';

interface UseAddressFormResult {
  form: EnderecoInput;
  setForm: (next: EnderecoInput) => void;
  isSaving: boolean;
  isDirty: boolean;
  persistence: AddressPersistenceState;
  save: () => Promise<boolean>;
}

const snapshotOf = (input: EnderecoInput): string =>
  JSON.stringify({
    rua: input.rua,
    numero: input.numero,
    complemento: input.complemento ?? '',
    bairro: input.bairro,
    cidade: input.cidade,
    estado: input.estado,
    cep: input.cep,
  });

/**
 * Estado do formulário de endereço: rascunho local ≠ persistido no servidor.
 */
export const useAddressForm = (scope: AddressScope): UseAddressFormResult => {
  const { addToast } = useToast();
  const [form, setForm] = useState<EnderecoInput>(() => enderecoService.getDraft(scope));
  const [isSaving, setIsSaving] = useState(false);
  const [persistence, setPersistence] = useState<AddressPersistenceState>(() =>
    enderecoService.getPersistenceState(scope),
  );
  const [lastServerSnapshot, setLastServerSnapshot] = useState<string | null>(() => {
    const state = enderecoService.getPersistenceState(scope);
    return state.persistedOnServer ? snapshotOf(enderecoService.getDraft(scope)) : null;
  });

  const isDirty = snapshotOf(form) !== (lastServerSnapshot ?? snapshotOf(emptyEndereco()));

  const save = async (): Promise<boolean> => {
    const parsed = EnderecoInputSchema.safeParse(form);
    if (!parsed.success) {
      addToast('error', 'Erro', parsed.error.issues[0]?.message ?? 'Preencha o endereço.');
      return false;
    }
    setIsSaving(true);
    try {
      const result = await enderecoService.saveForScope(scope, parsed.data);
      setPersistence(enderecoService.getPersistenceState(scope));
      if (!result.persistedOnServer) {
        addToast(
          'error',
          'Endereço não gravado',
          'A alteração ficou só neste navegador. O servidor não confirmou a gravação.',
        );
        return false;
      }
      setLastServerSnapshot(snapshotOf(parsed.data));
      setForm({ ...parsed.data, complemento: parsed.data.complemento ?? '' });
      addToast(
        'success',
        'Sucesso',
        result.addressId
          ? 'Endereço gravado no servidor.'
          : 'Endereço cadastrado. Este dispositivo ainda não recebeu o identificador; a próxima edição pode falhar até existir um GET na API.',
      );
      return true;
    } catch (err) {
      setPersistence(enderecoService.getPersistenceState(scope));
      const msg = err instanceof Error ? err.message : 'Erro ao salvar endereço';
      console.error('[useAddressForm]', err);
      addToast('error', 'Endereço não gravado', msg);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { form, setForm, isSaving, isDirty, persistence, save };
};
