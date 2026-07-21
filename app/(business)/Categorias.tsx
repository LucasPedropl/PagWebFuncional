import React, { useMemo, useState } from 'react';
import { BusinessLayout } from '../../components/layout/BusinessLayout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { Plus, Tags, Loader2, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useCategorias } from '../../features/catalog/hooks/useCategorias';
import { Categoria } from '../../features/catalog/schemas/catalogSchemas';

export const Categorias: React.FC = () => {
  const { addToast } = useToast();
  const { categorias, isLoading, error, create, update, remove } = useCategorias();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const active = useMemo(
    () => categorias.filter((c) => c.ativo !== false),
    [categorias],
  );

  const openCreate = () => {
    setEditing(null);
    setNome('');
    setDescricao('');
    setIsModalOpen(true);
  };

  const openEdit = (cat: Categoria) => {
    setEditing(cat);
    setNome(cat.nome);
    setDescricao(cat.descricao);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !descricao.trim()) {
      addToast('error', 'Campos obrigatórios', 'Preencha nome e descrição.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { nome: nome.trim(), descricao: descricao.trim() };
      if (editing) {
        await update(editing.id, payload);
        addToast('success', 'Categoria atualizada', 'Alterações salvas.');
      } else {
        await create(payload);
        addToast('success', 'Categoria criada', 'Categoria disponível no catálogo.');
      }
      setIsModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      console.error('[Categorias]', err);
      addToast('error', 'Erro', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat: Categoria) => {
    try {
      await remove(cat.id);
      addToast('success', 'Categoria removida', `"${cat.nome}" foi desativada.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir';
      console.error('[Categorias] delete:', err);
      addToast('error', 'Erro', msg);
    }
  };

  return (
    <BusinessLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500 mt-1">
            Agrupe produtos e serviços do catálogo da empresa.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nova categoria
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center py-16 gap-2 text-center">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      ) : active.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Tags className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="mt-3 text-gray-600">Nenhuma categoria cadastrada.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col"
            >
              <h3 className="font-bold text-gray-900">{cat.nome}</h3>
              <p className="text-sm text-gray-500 mt-1 flex-1 line-clamp-3">{cat.descricao}</p>
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openEdit(cat)}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleDelete(cat)}
                  className="text-red-600 hover:bg-red-50 hover:border-red-200 px-3"
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
        title={editing ? 'Editar categoria' : 'Nova categoria'}
      >
        <form className="space-y-4" onSubmit={(e) => void handleSave(e)}>
          <Input
            label="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            placeholder="Ex: Beleza, Consultoria, Alimentação..."
          />
          <Textarea
            label="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            required
            placeholder="Descreva brevemente o propósito desta categoria..."
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSaving} className="flex-1">
              Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </BusinessLayout>
  );
};
