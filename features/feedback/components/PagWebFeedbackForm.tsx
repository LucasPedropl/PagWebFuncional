import React, { useId, useRef, useState } from 'react';
import { FileUp, Loader2, MessageSquareWarning, Paperclip, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { formTextareaClass } from '../../../components/ui/formStyles';
import { useToast } from '../../../context/ToastContext';
import {
  FEEDBACK_ACCEPT_ATTR,
  FEEDBACK_MAX_FILES,
  isFeedbackFileAllowed,
} from '../constants/feedbackUpload';
import { useFeedbackSubmit } from '../hooks/useFeedbackSubmit';
import { FeedbackApiUnavailableError } from '../services/feedbackService';

/** Formulário de feedback sobre a plataforma PagWeb (cliente ou estabelecimento). */
export const PagWebFeedbackForm: React.FC = () => {
  const { addToast } = useToast();
  const { submit, isSubmitting } = useFeedbackSubmit();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tituloId = useId();
  const descricaoId = useId();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const addFiles = (incoming: FileList | null) => {
    if (!incoming?.length) return;
    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (next.length >= FEEDBACK_MAX_FILES) {
        addToast('error', 'Anexos', `Máximo de ${FEEDBACK_MAX_FILES} arquivos.`);
        break;
      }
      if (!isFeedbackFileAllowed(file)) {
        addToast(
          'error',
          'Arquivo inválido',
          `${file.name}: use imagens (JPG, PNG…) ou PDF até 10 MB.`,
        );
        continue;
      }
      next.push(file);
    }
    setFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await submit(titulo, descricao, files);
      addToast(
        'success',
        'Feedback enviado',
        'Obrigado. O time PagWeb vai analisar seu relato.',
      );
      setTitulo('');
      setDescricao('');
      setFiles([]);
    } catch (err) {
      const message =
        err instanceof FeedbackApiUnavailableError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Não foi possível enviar.';
      addToast('error', 'Feedback PagWeb', message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
          <MessageSquareWarning className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Feedback PagWeb</h1>
          <p className="text-sm text-slate-600 mt-1">
            Relate bugs ou sugestões sobre a{' '}
            <span className="font-medium text-slate-800">plataforma PagWeb</span> (não é
            mensagem para um estabelecimento). Anexe prints ou PDFs se ajudar.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5"
      >
        <div>
          <label htmlFor={tituloId} className="text-sm font-medium text-slate-700">
            Título
          </label>
          <Input
            id={tituloId}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Erro ao abrir o chat"
            className="mt-1.5"
            maxLength={120}
            required
          />
        </div>

        <div>
          <label htmlFor={descricaoId} className="text-sm font-medium text-slate-700">
            Descrição
          </label>
          <textarea
            id={descricaoId}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="O que você estava fazendo no PagWeb? O que esperava? O que aconteceu?"
            className={`${formTextareaClass} mt-1.5 min-h-[140px]`}
            maxLength={4000}
            required
          />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Anexos (opcional)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept={FEEDBACK_ACCEPT_ATTR}
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="w-4 h-4" />
            Adicionar arquivos
          </Button>
          <p className="text-xs text-slate-500 mt-2">
            Até {FEEDBACK_MAX_FILES} arquivos — imagens ou PDF, 10 MB cada.
          </p>
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between gap-2 text-sm bg-slate-50 border border-slate-100 rounded-lg px-3 py-2"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 shrink-0 text-slate-400" />
                    <span className="truncate">{file.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 text-slate-400 hover:text-red-600"
                    aria-label="Remover anexo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Enviando…
            </>
          ) : (
            'Enviar feedback'
          )}
        </Button>
      </form>
    </div>
  );
};
