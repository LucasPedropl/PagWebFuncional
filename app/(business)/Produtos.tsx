import React, { useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Plus, Package, Loader2, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useProdutos } from '../../features/catalog/hooks/useProdutos';
import { CatalogItem } from '../../features/catalog/schemas/catalogSchemas';
import { CategoriaSearchField } from '../../features/catalog/components/CategoriaSearchField';
import { formatServicePrice } from '../../features/services/utils/serviceFormatters';

export const Produtos: React.FC = () => {
  const { addToast } = useToast();
  const { produtos, isLoading, error, create, update, remove } = useProdutos();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | number>('');
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setNome('');
    setPreco('');
    setDescricao('');
    setCategoriaId('');
    setIsModalOpen(true);
  };

  const openEdit = (item: CatalogItem) => {
    setEditing(item);
    setNome(item.nome);
    setPreco(String(item.preco));
    setDescricao(item.descricao);
    setCategoriaId(item.categorias[0]?.id ?? '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const precoNum = Number(String(preco).replace(',', '.'));
    if (!nome.trim() || !descricao.trim() || Number.isNaN(precoNum)) {
      addToast('error', 'Dados inválidos', 'Preencha nome, descrição e preço.');
      return;
    }
    const catNum = Number(categoriaId);
    setIsSaving(true);
    try {
      const payload = {
        nome: nome.trim(),
        preco: precoNum,
        descricao: descricao.trim(),
        categorias: Number.isFinite(catNum) && catNum > 0 ? [catNum] : [],
      };
      if (editing) {
        await update(editing.id, payload);
        addToast('success', 'Produto atualizado', 'Alterações salvas.');
      } else {
        await create(payload);
        addToast('success', 'Produto criado', 'Produto disponível no catálogo.');
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      console.error('[Produtos]', err);
      addToast('error', 'Erro', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: CatalogItem) => {
    try {
      await remove(item.id);
      addToast('success', 'Produto removido', `"${item.nome}" foi desativado.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir';
      console.error('[Produtos] delete:', err);
      addToast('error', 'Erro', msg);
    }
  };

  return (
    <BusinessLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500 mt-1">Catálogo de produtos da empresa (API).</p>
        </div>
        <Button onClick={openCreate} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" />
          Novo produto
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-2 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      ) : produtos.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="mt-3 text-gray-600">Nenhum produto cadastrado.</p>
          <p className="text-xs text-gray-400 mt-1">
            Crie categorias antes para facilitar a listagem.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {produtos.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-gray-900">{item.nome}</h3>
                <span className="text-violet-700 font-semibold shrink-0">
                  {formatServicePrice(item.preco)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 flex-1 line-clamp-3">{item.descricao}</p>
              {item.categorias.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  {item.categorias.map((c) => c.nome ?? `#${c.id}`).join(', ')}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() => openEdit(item)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleDelete(item)}
                  className="bg-red-50 hover:bg-red-100 text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Editar produto' : 'Novo produto'}
      >
        <form className="space-y-4" onSubmit={(e) => void handleSave(e)}>
          <Input
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Ex: Shampoo Anticaspa 300ml"
          />
          <Input
            label="Preço"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            required
            placeholder="0,00"
          />
          <Textarea
            label="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
            placeholder="Detalhes sobre o produto, como marca, dimensões, peso, etc."
          />
          <CategoriaSearchField
            value={categoriaId}
            onChange={setCategoriaId}
            placeholder="Selecione..."
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
            >
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </BusinessLayout>
  );
};
