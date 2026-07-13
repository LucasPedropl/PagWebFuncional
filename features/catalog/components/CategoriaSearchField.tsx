import React, { useMemo, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { SearchSelect } from '../../../components/ui/SearchSelect';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useCategorias } from '../hooks/useCategorias';
import { categoriaService } from '../services/categoriaService';

interface CategoriaSearchFieldProps {
  value: string | number;
  onChange: (value: string | number) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Select de categoria com cadastro rápido em Modal (POST /api/Categorias).
 */
export const CategoriaSearchField: React.FC<CategoriaSearchFieldProps> = ({
  value,
  onChange,
  label = 'Categoria',
  placeholder = 'Selecione...',
  disabled = false,
}) => {
  const { categorias, refresh } = useCategorias();
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickNome, setQuickNome] = useState('');
  const [quickDescricao, setQuickDescricao] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const options = useMemo(
    () =>
      categorias
        .filter((c) => c.ativo !== false)
        .map((c) => ({ value: c.id, label: c.nome })),
    [categorias],
  );

  const handleQuickCreate = async () => {
    const nome = quickNome.trim();
    const descricao = quickDescricao.trim() || nome;
    if (!nome) {
      setQuickError('Informe o nome da categoria.');
      return;
    }
    setIsCreating(true);
    setQuickError(null);
    try {
      await categoriaService.create({ nome, descricao });
      const list = await categoriaService.listPrivado();
      await refresh();
      const created =
        list.find((c) => c.nome === nome && c.ativo !== false) ??
        list.filter((c) => c.nome === nome).sort((a, b) => b.id - a.id)[0];
      if (created) onChange(created.id);
      setQuickNome('');
      setQuickDescricao('');
      setShowQuickForm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar categoria';
      console.error('[CategoriaSearchField]', err);
      setQuickError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      <SearchSelect
        label={label}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        footer={
          <button
            type="button"
            onClick={() => setShowQuickForm(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
            Cadastrar categoria
          </button>
        }
      />

      <Modal
        isOpen={showQuickForm}
        onClose={() => {
          setShowQuickForm(false);
          setQuickError(null);
        }}
        title="Nova categoria"
        zIndexClass="z-[210]"
      >
        <div className="space-y-4">
          <Input
            label="Nome"
            value={quickNome}
            onChange={(e) => setQuickNome(e.target.value)}
            placeholder="Ex: Consultoria"
            disabled={isCreating}
          />
          <Input
            label="Descrição"
            value={quickDescricao}
            onChange={(e) => setQuickDescricao(e.target.value)}
            placeholder="Opcional — usa o nome se vazio"
            disabled={isCreating}
          />
          {quickError ? <p className="text-xs text-red-600">{quickError}</p> : null}
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => {
                setShowQuickForm(false);
                setQuickError(null);
              }}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void handleQuickCreate()}
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              disabled={isCreating}
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-1 inline" /> : null}
              Criar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
