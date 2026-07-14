import React, { useState, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { SearchSelect } from '../../../components/ui/SearchSelect';
import { User as UserType } from '../../../types';

interface CatalogItemLike {
  id?: number;
  nome?: string;
  preco?: number;
  ativo?: boolean;
  descricao?: string;
}

interface CobrancaFormProps {
  clients: UserType[];
  produtos: CatalogItemLike[];
  servicos: CatalogItemLike[];
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (data: {
    descricao: string;
    observacao?: string;
    clientId: number;
    valor: number;
    produtoId?: number;
    servicoId?: number;
  }) => Promise<boolean>;
}

export const CobrancaForm: React.FC<CobrancaFormProps> = ({
  clients,
  produtos,
  servicos,
  isSaving,
  onCancel,
  onSubmit,
}) => {
  const [clientId, setClientId] = useState<string | number>('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [produtoId, setProdutoId] = useState<string | number>('');
  const [servicoId, setServicoId] = useState<string | number>('');

  const clientOptions = useMemo(
    () =>
      clients
        .filter((c) => c.idUser != null)
        .map((c) => ({
          value: c.idUser as number,
          label: `${c.nome}${c.sobreNome ? ` ${c.sobreNome}` : ''}`.trim(),
          subLabel: c.email,
        })),
    [clients],
  );

  const produtoOptions = useMemo(
    () => [
      { value: '', label: 'Nenhum' },
      ...produtos.map((p) => ({
        value: p.id ?? '',
        label: p.nome ?? '',
        subLabel: p.preco != null ? `R$ ${p.preco.toFixed(2)}` : '—',
      })),
    ],
    [produtos],
  );

  const servicoOptions = useMemo(
    () => [
      { value: '', label: 'Nenhum' },
      ...servicos.map((s) => ({
        value: s.id ?? '',
        label: s.nome ?? '',
        subLabel: s.preco != null ? `R$ ${s.preco.toFixed(2)}` : '—',
      })),
    ],
    [servicos],
  );

  const suggestFromCatalog = (nextProduto: string | number, nextServico: string | number) => {
    let total = 0;
    const p = produtos.find((x) => x.id === Number(nextProduto));
    const s = servicos.find((x) => x.id === Number(nextServico));
    if (p && p.preco != null) total += p.preco;
    if (s && s.preco != null) total += s.preco;
    if (total > 0) setValor(total.toFixed(2));
    if (!descricao.trim()) {
      const parts = [s?.nome, p?.nome].filter(Boolean) as string[];
      if (parts.length) setDescricao(parts.join(' + '));
    }
  };

  const handleReset = () => {
    setClientId('');
    setDescricao('');
    setValor('');
    setObservacao('');
    setProdutoId('');
    setServicoId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    const parsedValor = Number(valor.replace(',', '.'));
    if (parsedValor < 5) return;

    const success = await onSubmit({
      descricao: descricao.trim(),
      observacao: observacao.trim() || undefined,
      clientId: Number(clientId),
      valor: parsedValor,
      produtoId: Number(produtoId) > 0 ? Number(produtoId) : undefined,
      servicoId: Number(servicoId) > 0 ? Number(servicoId) : undefined,
    });

    if (success) {
      handleReset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Cliente */}
      <SearchSelect
        label="Cliente"
        options={clientOptions}
        value={clientId}
        onChange={setClientId}
        placeholder="Selecione o cliente..."
      />

      {/* Catálogo de Serviços e Produtos lado a lado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchSelect
          label="Serviço do catálogo (opcional)"
          options={servicoOptions}
          value={servicoId}
          onChange={(v) => {
            setServicoId(v);
            suggestFromCatalog(produtoId, v);
          }}
          placeholder="Nenhum"
        />

        <SearchSelect
          label="Produto do catálogo (opcional)"
          options={produtoOptions}
          value={produtoId}
          onChange={(v) => {
            setProdutoId(v);
            suggestFromCatalog(v, servicoId);
          }}
          placeholder="Nenhum"
        />
      </div>

      {/* Descrição */}
      <Input
        label="Descrição da Cobrança"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Ex.: Consultoria técnica ou Produto X"
        required
      />

      {/* Valor */}
      <Input
        label="Valor total (R$)"
        type="number"
        min="5"
        step="0.01"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="0,00"
        error={valor !== '' && Number(valor.replace(',', '.')) < 5 ? 'O valor mínimo para cobrança é R$ 5,00' : undefined}
        required
      />

      {/* Observação */}
      <Textarea
        label="Observação interna (opcional)"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Informações adicionais sobre esta cobrança..."
        rows={3}
      />

      {/* Botões de Ação no estilo padrão do sistema */}
      <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
          className="text-sm font-medium"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSaving}
          disabled={!clientId || !descricao.trim() || !valor || Number(valor.replace(',', '.')) < 5}
          className="bg-slate-900 hover:bg-slate-800 text-sm font-medium"
        >
          Cadastrar cobrança
        </Button>
      </div>
    </form>
  );
};
