import { z } from 'zod';

export const ADMIN_UPGRADE_MODES = ['pj', 'pf'] as const;
export type AdminUpgradeMode = (typeof ADMIN_UPGRADE_MODES)[number];

export const AdminUpgradePjFormSchema = z.object({
  nome: z.string().min(2, 'Informe o nome do estabelecimento'),
  cnpj: z.string().min(14, 'Informe um CNPJ válido'),
  telefone: z.string().min(8, 'Informe o telefone'),
});

export type AdminUpgradePjFormValues = z.infer<typeof AdminUpgradePjFormSchema>;

/** Catálogo com preços fictícios até existir cobrança real. */
export const ADMIN_UPGRADE_PRICING = {
  basePj: { label: 'Admin empresa (PJ)', priceLabel: 'Grátis no lançamento', amount: 0 },
  basePf: { label: 'Admin pessoal (PF)', priceLabel: 'Grátis no lançamento', amount: 0 },
  payment: { label: 'Módulo Pagamentos', priceLabel: 'R$ 49,90/mês', amount: 49.9 },
  whatsapp: { label: 'Módulo WhatsApp', priceLabel: 'R$ 29,90/mês', amount: 29.9 },
} as const;
