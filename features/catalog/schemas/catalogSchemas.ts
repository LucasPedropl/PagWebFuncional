import { z } from 'zod';

const CategoriaRefSchema = z.object({
  id: z.number(),
  nome: z.string().optional(),
});

export const CategoriaSchema = z.object({
  id: z.number(),
  nome: z.string(),
  descricao: z.string().nullish().transform((v) => v ?? ''),
  idEmpresa: z.number().optional(),
  ativo: z.boolean().optional(),
});

export type Categoria = z.infer<typeof CategoriaSchema>;

export const CategoriaInputSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  descricao: z.string().min(1, 'Descrição obrigatória'),
});

export type CategoriaInput = z.infer<typeof CategoriaInputSchema>;

export const CatalogItemSchema = z.object({
  id: z.number(),
  nome: z.string(),
  preco: z.number(),
  descricao: z.string().nullish().transform((v) => v ?? ''),
  ativo: z.boolean().optional(),
  categorias: z
    .array(CategoriaRefSchema)
    .nullish()
    .transform((v) => v ?? []),
});

export type CatalogItem = z.infer<typeof CatalogItemSchema>;

export const CatalogItemInputSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  preco: z.number().nonnegative('Preço inválido'),
  descricao: z.string().min(1, 'Descrição obrigatória'),
  categorias: z.array(z.number()).optional(),
});

export type CatalogItemInput = z.infer<typeof CatalogItemInputSchema>;

/** Item de catálogo na vitrine pública (Explorar / CompanyDetails). */
export type ExploreCatalogItem = CatalogItem & {
  idEmpresa: number;
  kind: 'servico' | 'produto';
};
