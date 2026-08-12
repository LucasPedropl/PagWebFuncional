import React, { useState, useMemo } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { SearchSelect } from '../../../components/ui/SearchSelect';
import { MultiSearchSelect } from '../../../components/ui/MultiSearchSelect';
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
  counterpartyLabel?: string;
  counterpartyPlaceholder?: string;
  showCatalogFields?: boolean;
  onSubmit: (data: {
    descricao: string;
    observacao?: string;
    clientId: number;
    valor: number;
    produtoIds?: number[];
    servicoIds?: number[];
  }) => Promise<boolean>;
}

export const CobrancaForm: React.FC<CobrancaFormProps> = ({
  clients,
  produtos,
  servicos,
  isSaving,
  onCancel,
  counterpartyLabel = 'Cliente',
  counterpartyPlaceholder = 'Selecione o cliente...',
  showCatalogFields = true,
  onSubmit,
}) => {
  const [clientId, setClientId] = useState<string | number>('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [observacao, setObservacao] = useState('');
  const [produtoIds, setProdutoIds] = useState<Array<string | number>>([]);
  const [servicoIds, setServicoIds] = useState<Array<string | number>>([]);

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
    () =>
      produtos
        .filter((p) => p.id != null)
        .map((p) => ({
          value: p.id as number,
          label: p.nome ?? '',
          subLabel: p.preco != null ? `R$ ${p.preco.toFixed(2)}` : '—',
        })),
    [produtos],
  );

  const servicoOptions = useMemo(
    () =>
      servicos
        .filter((s) => s.id != null)
        .map((s) => ({
          value: s.id as number,
          label: s.nome ?? '',
          subLabel: s.preco != null ? `R$ ${s.preco.toFixed(2)}` : '—',
        })),
    [servicos],
  );

  const suggestFromCatalog = (
    nextProdutos: Array<string | number>,
    nextServicos: Array<string | number>,
  ) => {
    let total = 0;
    const names: string[] = [];

    for (const id of nextServicos) {
      const s = servicos.find((x) => x.id === Number(id));
      if (s?.preco != null) total += s.preco;
      if (s?.nome) names.push(s.nome);
    }
    for (const id of nextProdutos) {
      const p = produtos.find((x) => x.id === Number(id));
      if (p?.preco != null) total += p.preco;
      if (p?.nome) names.push(p.nome);
    }

    if (total > 0) setValor(total.toFixed(2));
    if (!descricao.trim() && names.length > 0) {
      setDescricao(names.join(' + '));
    }
  };

  const handleReset = () => {
    setClientId('');
    setDescricao('');
    setValor('');
    setObservacao('');
    setProdutoIds([]);
    setServicoIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;
    const parsedValor = Number(valor.replace(',', '.'));
    if (parsedValor < 5) return;

    const parsedProdutoIds = produtoIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);
    const parsedServicoIds = servicoIds
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id) && id > 0);

    const success = await onSubmit({
      descricao: descricao.trim(),
      observacao: observacao.trim() || undefined,
      clientId: Number(clientId),
      valor: parsedValor,
      produtoIds: parsedProdutoIds.length > 0 ? parsedProdutoIds : undefined,
      servicoIds: parsedServicoIds.length > 0 ? parsedServicoIds : undefined,
    });

    if (success) {
      handleReset();
    }
  };

  const hasCatalog =
    showCatalogFields && (produtos.length > 0 || servicos.length > 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SearchSelect
        label={counterpartyLabel}
        options={clientOptions}
        value={clientId}
        onChange={setClientId}
        placeholder={counterpartyPlaceholder}
      />

      {hasCatalog ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MultiSearchSelect
            label="Serviços do catálogo (opcional)"
            options={servicoOptions}
            value={servicoIds}
            onChange={(next) => {
              setServicoIds(next);
              suggestFromCatalog(produtoIds, next);
            }}
            placeholder="Nenhum"
            hint="Pode selecionar mais de um."
          />

          <MultiSearchSelect
            label="Produtos do catálogo (opcional)"
            options={produtoOptions}
            value={produtoIds}
            onChange={(next) => {
              setProdutoIds(next);
              suggestFromCatalog(next, servicoIds);
            }}
            placeholder="Nenhum"
            hint="Pode selecionar mais de um."
          />
        </div>
      ) : null}

      <Input
        label="Descrição da Cobrança"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        placeholder="Ex.: Consultoria técnica ou Produto X"
        required
      />

      <Input
        label="Valor total (R$)"
        type="number"
        min="5"
        step="0.01"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="0,00"
        error={
          valor !== '' && Number(valor.replace(',', '.')) < 5
            ? 'O valor mínimo para cobrança é R$ 5,00'
            : undefined
        }
        required
      />

      <Textarea
        label="Observação interna (opcional)"
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Informações adicionais sobre esta cobrança..."
        rows={3}
      />

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
