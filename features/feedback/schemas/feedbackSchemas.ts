import { z } from 'zod';

const attachmentSchema = z
  .object({
    idArquivo: z.coerce.number().optional(),
    IdArquivo: z.coerce.number().optional(),
    nomeArquivo: z.string().optional(),
    NomeArquivo: z.string().optional(),
    urlArquivo: z.string().optional(),
    UrlArquivo: z.string().optional(),
    tipoMime: z.string().optional(),
    TipoMime: z.string().optional(),
  })
  .transform((raw) => ({
    idArquivo: raw.idArquivo ?? raw.IdArquivo ?? 0,
    nomeArquivo: raw.nomeArquivo ?? raw.NomeArquivo ?? 'anexo',
    urlArquivo: raw.urlArquivo ?? raw.UrlArquivo ?? '',
    tipoMime: raw.tipoMime ?? raw.TipoMime ?? '',
  }));

export const FeedbackItemSchema = z
  .object({
    idFeedback: z.coerce.number().optional(),
    IdFeedback: z.coerce.number().optional(),
    titulo: z.string().optional(),
    Titulo: z.string().optional(),
    descricao: z.string().optional(),
    Descricao: z.string().optional(),
    dataCriacao: z.string().optional(),
    DataCriacao: z.string().optional(),
    idUsuario: z.coerce.number().optional(),
    IdUsuario: z.coerce.number().optional(),
    nomeUsuario: z.string().optional(),
    NomeUsuario: z.string().optional(),
    emailUsuario: z.string().optional(),
    EmailUsuario: z.string().optional(),
    tipoPerfil: z.string().optional(),
    TipoPerfil: z.string().optional(),
    arquivos: z.array(attachmentSchema).optional(),
    Arquivos: z.array(attachmentSchema).optional(),
  })
  .transform((raw) => ({
    idFeedback: raw.idFeedback ?? raw.IdFeedback ?? 0,
    titulo: raw.titulo ?? raw.Titulo ?? '',
    descricao: raw.descricao ?? raw.Descricao ?? '',
    dataCriacao: raw.dataCriacao ?? raw.DataCriacao ?? '',
    idUsuario: raw.idUsuario ?? raw.IdUsuario ?? 0,
    nomeUsuario: raw.nomeUsuario ?? raw.NomeUsuario ?? '',
    emailUsuario: raw.emailUsuario ?? raw.EmailUsuario ?? '',
    tipoPerfil: raw.tipoPerfil ?? raw.TipoPerfil ?? '',
    arquivos: raw.arquivos ?? raw.Arquivos ?? [],
  }));

export type FeedbackItem = z.infer<typeof FeedbackItemSchema>;

export const FeedbackSubmitInputSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, 'Informe um título com pelo menos 3 caracteres.')
    .max(120, 'Título muito longo (máx. 120 caracteres).'),
  descricao: z
    .string()
    .trim()
    .min(10, 'Descreva o problema com pelo menos 10 caracteres.')
    .max(4000, 'Descrição muito longa (máx. 4000 caracteres).'),
});

export type FeedbackSubmitInput = z.infer<typeof FeedbackSubmitInputSchema>;
