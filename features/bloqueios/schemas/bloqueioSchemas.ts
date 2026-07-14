import { z } from 'zod';

export const EmpresaBloqueadaSchema = z
  .object({
    idEmpresa: z.coerce.number().optional(),
    IdEmpresa: z.coerce.number().optional(),
    nomeEmpresa: z.string().optional(),
    NomeEmpresa: z.string().optional(),
    cnpj: z.string().optional(),
    Cnpj: z.string().optional(),
    logo: z.string().nullable().optional(),
    Logo: z.string().nullable().optional(),
  })
  .transform((raw) => ({
    idEmpresa: raw.idEmpresa ?? raw.IdEmpresa ?? 0,
    nomeEmpresa: raw.nomeEmpresa ?? raw.NomeEmpresa ?? '',
    cnpj: raw.cnpj ?? raw.Cnpj ?? '',
    logo: raw.logo ?? raw.Logo ?? null,
  }));

export type EmpresaBloqueada = z.infer<typeof EmpresaBloqueadaSchema>;

export const PlanoBloqueadoSchema = z
  .object({
    idPlano: z.coerce.number().optional(),
    IdPlano: z.coerce.number().optional(),
    nomePlano: z.string().optional(),
    NomePlano: z.string().optional(),
    nomeEmpresa: z.string().optional(),
    NomeEmpresa: z.string().optional(),
    valorPlano: z.coerce.number().optional(),
    ValorPlano: z.coerce.number().optional(),
    dataBloqueio: z.string().optional(),
    DataBloqueio: z.string().optional(),
  })
  .transform((raw) => ({
    idPlano: raw.idPlano ?? raw.IdPlano ?? 0,
    nomePlano: raw.nomePlano ?? raw.NomePlano ?? '',
    nomeEmpresa: raw.nomeEmpresa ?? raw.NomeEmpresa ?? '',
    valorPlano: raw.valorPlano ?? raw.ValorPlano ?? 0,
    dataBloqueio: raw.dataBloqueio ?? raw.DataBloqueio ?? '',
  }));

export type PlanoBloqueado = z.infer<typeof PlanoBloqueadoSchema>;
