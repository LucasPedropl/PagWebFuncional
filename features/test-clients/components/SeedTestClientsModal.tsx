import React, { useState } from 'react';
import { FlaskConical, Copy, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../context/ToastContext';
import {
  TEST_CLIENT_DEFAULT_PASSWORD,
  GeneratedTestClientCredentials,
} from '../utils/testClientGenerators';
import { seedTestClientsForCurrentCompany } from '../services/testClientSeedService';

interface SeedTestClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}

export const SeedTestClientsModal: React.FC<SeedTestClientsModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { addToast } = useToast();
  const [quantity, setQuantity] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [createdClients, setCreatedClients] = useState<GeneratedTestClientCredentials[]>([]);

  const handleClose = () => {
    setCreatedClients([]);
    setQuantity(5);
    onClose();
  };

  const handleSeed = async () => {
    setIsSaving(true);
    try {
      const result = await seedTestClientsForCurrentCompany(quantity);
      setCreatedClients(result.created);
      await onCreated();

      if (result.created.length > 0) {
        addToast(
          'success',
          'Clientes de teste',
          `${result.created.length} criado(s). Senha: ${TEST_CLIENT_DEFAULT_PASSWORD}`,
        );
      }
      if (result.failed.length > 0) {
        addToast(
          'error',
          'Alguns falharam',
          `${result.failed.length} não foram criados. Verifique o console.`,
        );
        console.error('[PagWeb] Falhas ao criar clientes de teste:', result.failed);
      }
      if (result.created.length === 0 && result.failed.length > 0) {
        addToast('error', 'Erro', result.failed[0]?.message || 'Nenhum cliente criado.');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar clientes de teste';
      addToast('error', 'Erro', message);
    } finally {
      setIsSaving(false);
    }
  };

  const copyCredentialsSummary = async () => {
    const lines = createdClients.map(
      (client) => `${client.email} | ${client.password}`,
    );
    const text = [`Senha padrão: ${TEST_CLIENT_DEFAULT_PASSWORD}`, ...lines].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      addToast('success', 'Copiado', 'Credenciais copiadas para a área de transferência.');
    } catch {
      addToast('error', 'Erro', 'Não foi possível copiar automaticamente.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={createdClients.length > 0 ? 'Clientes de teste criados' : 'Criar clientes de teste'}
      size="md"
      footer={
        createdClients.length > 0 ? (
          <>
            <Button type="button" variant="outline" onClick={() => void copyCredentialsSummary()}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar credenciais
            </Button>
            <Button type="button" onClick={handleClose} className="bg-slate-900 hover:bg-slate-800">
              Fechar
            </Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              type="button"
              isLoading={isSaving}
              onClick={() => void handleSeed()}
              className="bg-slate-900 hover:bg-slate-800"
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              Criar agora
            </Button>
          </>
        )
      }
    >
      {createdClients.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-900">
              <p className="font-medium">{createdClients.length} cliente(s) ativos e vinculados.</p>
              <p className="mt-1">
                Senha de todas as contas: <strong>{TEST_CLIENT_DEFAULT_PASSWORD}</strong>
              </p>
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-100 text-sm">
            {createdClients.map((client) => (
              <li key={client.email} className="px-3 py-2 font-mono text-xs text-gray-700 break-all">
                {client.email}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Cadastra clientes já <strong>ativos</strong> e vinculados à sua empresa (sem e-mail /
            activate), via <code className="text-xs">register?idEmpresa</code>. Ideal para massar
            assinaturas e pagamentos.
          </p>
          <Input
            label="Quantidade"
            type="number"
            min={1}
            max={50}
            value={String(quantity)}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          />
          <p className="text-xs text-gray-500">
            E-mails aleatórios <span className="font-mono">@pagweb-teste.local</span> · senha{' '}
            <span className="font-mono">{TEST_CLIENT_DEFAULT_PASSWORD}</span> · máx. 50 por vez
          </p>
        </div>
      )}
    </Modal>
  );
};
