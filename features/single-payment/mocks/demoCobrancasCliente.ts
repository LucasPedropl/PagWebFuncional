import type { Cobranca } from '../schemas/cobrancaSchemas';

/** Cobranças de terceiros que o cliente precisa pagar (demo). */
export const DEMO_COBRANCAS_A_PAGAR_CLIENTE: Cobranca[] = [
  {
    id: 9001,
    idEmpresa: 101,
    valorTotal: 189.9,
    descricao: 'Manutenção preventiva — pacote básico',
    observacao: 'Inclui revisão e troca de filtros.',
    status: 'Aberto',
    empresa: { idEmpresa: 101, nome: 'Auto Center Norte', cnpj: '12.345.678/0001-90' },
    produtos: [],
    servicos: [{ id: 1, nome: 'Manutenção preventiva', preco: 189.9 }],
  },
  {
    id: 9002,
    idEmpresa: 202,
    valorTotal: 420,
    descricao: 'Consultoria financeira (2h)',
    observacao: null,
    status: 'Atrasado',
    empresa: { idEmpresa: 202, nome: 'Consultoria Silva & Cia', cnpj: null },
    produtos: [],
    servicos: [{ id: 2, nome: 'Consultoria', preco: 420 }],
  },
  {
    id: 9003,
    idEmpresa: 101,
    valorTotal: 75.5,
    descricao: 'Produtos — kit higiene automotiva',
    observacao: 'Retirada na loja em até 5 dias úteis.',
    status: 'Pago',
    empresa: { idEmpresa: 101, nome: 'Auto Center Norte', cnpj: '12.345.678/0001-90' },
    produtos: [{ id: 10, nome: 'Kit higiene', preco: 75.5 }],
    servicos: [],
  },
  {
    id: 9004,
    idEmpresa: 303,
    valorTotal: 1299,
    descricao: 'Instalação de ar-condicionado split',
    observacao: null,
    status: 'Repassado',
    empresa: { idEmpresa: 303, nome: 'ClimaFrio Instalações', cnpj: '98.765.432/0001-11' },
    produtos: [],
    servicos: [{ id: 3, nome: 'Instalação split', preco: 1299 }],
  },
  {
    id: 9005,
    idEmpresa: 202,
    valorTotal: 50,
    descricao: 'Taxa de reagendamento',
    observacao: 'Cobrança cancelada pelo estabelecimento.',
    status: 'Cancelado',
    empresa: { idEmpresa: 202, nome: 'Consultoria Silva & Cia', cnpj: null },
    produtos: [],
    servicos: [],
  },
];

/** Cobranças que o cliente criou para outra pessoa pagar (demo). */
export const DEMO_COBRANCAS_CRIADAS_CLIENTE: Cobranca[] = [
  {
    id: 9101,
    valorTotal: 250,
    descricao: 'Freelance — layout de apresentação',
    observacao: 'Prazo acordado: 7 dias após pagamento.',
    status: 'Aberto',
    usuario: {
      idUser: 801,
      nome: 'Ricardo Mendes',
      email: 'ricardo.mendes@email.com',
    },
    produtos: [],
    servicos: [],
  },
  {
    id: 9102,
    valorTotal: 89.9,
    descricao: 'Reembolso de despesas de viagem',
    observacao: null,
    status: 'Pago',
    usuario: {
      idUser: 802,
      nome: 'Juliana Prado',
      email: 'juliana.prado@email.com',
    },
    produtos: [],
    servicos: [],
  },
];

/** Cobranças que a empresa precisa pagar a fornecedores/parceiros (demo). */
export const DEMO_COBRANCAS_A_PAGAR_EMPRESA: Cobranca[] = [
  {
    id: 9201,
    idEmpresa: 501,
    valorTotal: 340,
    descricao: 'Licença mensal — software de emissão fiscal',
    observacao: 'Vencimento dia 10.',
    status: 'Aberto',
    empresa: { idEmpresa: 501, nome: 'FiscalTech Soluções', cnpj: '11.222.333/0001-44' },
    produtos: [],
    servicos: [],
  },
  {
    id: 9202,
    idEmpresa: 502,
    valorTotal: 1200,
    descricao: 'Matéria-prima — lote #8842',
    observacao: null,
    status: 'Atrasado',
    empresa: { idEmpresa: 502, nome: 'Distribuidora Alfa', cnpj: '55.666.777/0001-88' },
    produtos: [],
    servicos: [],
  },
];

/** @deprecated Use DEMO_COBRANCAS_A_PAGAR_CLIENTE */
export const DEMO_COBRANCAS_CLIENTE = DEMO_COBRANCAS_A_PAGAR_CLIENTE;
