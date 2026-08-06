# Relatório de Novos Endpoints - API PagWebV1

Este relatório documenta os **26 novos endpoints** relevantes ao frontend do
PagWeb, trazendo suporte a catálogos de produtos, serviços, cobranças
estruturadas e fluxos de pagamento.

**Legenda de status no frontend**

| Status          | Significado                           |
| :-------------- | :------------------------------------ |
| ✅ Implementado | Integrado no frontend PagWebFuncional |
| ⏳ Pendente     | Ainda não integrado no frontend       |
| 🚫 Não usar     | Cross-tenant / inseguro no FE         |

---

## Tabela Geral de Novos Endpoints

| Método     | Rota/Endpoint                                                      | Nome Amigável                     | Status FE   | Onde no frontend                                                            |
| :--------- | :----------------------------------------------------------------- | :-------------------------------- | :---------- | :-------------------------------------------------------------------------- |
| **GET**    | `/api/Servicos`                                                    | Listar Todos os Serviços          | 🚫 Não usar | Cross-tenant; usar `empresa-servicos-publico`                               |
| **POST**   | `/api/Servicos`                                                    | Cadastrar Novo Serviço            | ✅          | `#/business/servicos` → `servicoService.create`                             |
| **GET**    | `/api/Servicos/{id}`                                               | Obter Detalhes do Serviço         | ✅          | `servicoService.getById` (camada de serviço)                                |
| **PUT**    | `/api/Servicos/{id}`                                               | Atualizar Serviço                 | ✅          | `#/business/servicos` → `servicoService.update`                             |
| **DELETE** | `/api/Servicos/{id}`                                               | Excluir Serviço                   | ✅          | `#/business/servicos` → `servicoService.remove`                             |
| **GET**    | `/api/Servicos/empresa-servicos-publico/{idEmpresa}/{idCategoria}` | Listar Serviços Públicos          | ✅          | `#/explorar` (aba Serviços) + `#/empresa/:id` + admin `#/business/servicos` |
| **POST**   | `/api/Produtos`                                                    | Cadastrar Novo Produto            | ✅          | `#/business/produtos` → `produtoService.create`                             |
| **GET**    | `/api/Produtos/{id}`                                               | Obter Detalhes do Produto         | ✅          | `produtoService.getById`                                                    |
| **PUT**    | `/api/Produtos/{id}`                                               | Atualizar Produto                 | ✅          | `#/business/produtos`                                                       |
| **DELETE** | `/api/Produtos/{id}`                                               | Excluir Produto                   | ✅          | `#/business/produtos`                                                       |
| **GET**    | `/api/Produtos/empresa-publico/{idEmpresa}/{categoria}`            | Listar Produtos Públicos          | ✅          | `#/explorar` (aba Produtos) + `#/empresa/:id`                               |
| **GET**    | `/api/Produtos/empresa-empresa/{categoria}`                        | Listar Produtos Internos          | ✅          | `#/business/produtos` (agregado por categorias)                             |
| **GET**    | `/api/Categorias`                                                  | Listar Todas as Categorias        | 🚫 Não usar | Cross-tenant; usar `empresa-categorias-publico`                             |
| **POST**   | `/api/Categorias`                                                  | Cadastrar Nova Categoria          | ✅          | `#/business/categorias`                                                     |
| **GET**    | `/api/Categorias/{id}`                                             | Obter Detalhes da Categoria       | ✅          | `categoriaService.getById`                                                  |
| **PUT**    | `/api/Categorias/{id}`                                             | Atualizar Categoria               | ✅          | `#/business/categorias`                                                     |
| **DELETE** | `/api/Categorias/{id}`                                             | Excluir Categoria                 | ✅          | `#/business/categorias`                                                     |
| **GET**    | `/api/Categorias/empresa-categorias-publico/{idEmpresa}`           | Listar Categorias Públicas        | ✅          | `#/explorar` (via hook) + `#/empresa/:id`                                   |
| **GET**    | `/api/Categorias/empresa-categorias-privado/{idEmpresa}`           | Listar Categorias Privadas        | ✅          | `#/business/categorias` → `categoriaService.listPrivado`                    |
| **POST**   | `/api/Cobrancas`                                                   | Criar Nova Cobrança               | ✅          | `#/business/pagamento-unico`                                                |
| **GET**    | `/api/Cobrancas/{id}`                                              | Obter Detalhes da Cobrança        | ✅          | `cobrancaService.getById`                                                   |
| **GET**    | `/api/Cobrancas/Empresa`                                           | Listar Cobranças da Empresa       | ✅          | `#/business/pagamento-unico`                                                |
| **GET**    | `/api/Cobrancas/Usuario`                                           | Listar Minhas Cobranças           | ✅          | `#/historico-servicos` + `UserLayout`                                       |
| **PUT**    | `/api/Cobrancas/Status/{id}`                                       | Atualizar Status da Cobrança      | ✅          | `#/business/pagamento-unico` (cancelar)                                     |
| **POST**   | `/api/v1/Pagamento/solicitar`                                      | Solicitar Pagamento de Assinatura | ✅          | `#/pagamentos` → `pagamentoService.solicitarMensalidade`                    |
| **POST**   | `/api/v1/Pagamento/unico-solicitar`                                | Solicitar Pagamento Único         | ✅          | `#/historico-servicos`                                                      |
| **POST**   | `/api/v1/Feedback`                                                 | Enviar feedback PagWeb (cliente ou estabelecimento) | ⏳ Pendente | `#/feedback`, `#/business/feedback` → `feedbackService.submit`              |
| **GET**    | `/api/v1/Feedback`                                                 | Listar feedbacks (app central **Bix**, time dev)  | ⏳ Pendente | **Não** integrar no PagWeb — ver `relatorio_erros_backend.md` item **17**   |
| **GET**    | `/api/ChavesPix`                                                   | Listar chaves PIX do admin                        | ✅          | `#/business/integracoes` → `chavePixService.list`                             |
| **POST**   | `/api/ChavesPix`                                                   | Cadastrar chave PIX (PIX na caixa)                | ✅          | `#/business/integracoes`                                                      |
| **PUT**    | `/api/ChavesPix/{idchavepix}`                                      | Atualizar chave PIX                               | ✅          | `chavePixService.update` (camada de serviço)                                  |
| **DELETE** | `/api/ChavesPix/{idchavepix}`                                      | Desativar chave PIX                               | ✅          | `#/business/integracoes`                                                      |
| **GET**    | `/api/ControleAcessos`                                             | Listar solicitações (Master)                      | ✅          | `#/business/integracoes` (painel Master)                                      |
| **POST**   | `/api/ControleAcessos`                                             | Solicitar integração Bixs (Admin)                 | ✅          | `#/business/integracoes`                                                      |
| **GET**    | `/api/ControleAcessos/{idcontrole}`                                | Detalhe da solicitação                            | ✅          | `controleAcessoService.getById`                                               |
| **PUT**    | `/api/ControleAcessos/{idcontrole}`                                | Aprovar/recusar (Master)                          | ✅          | `#/business/integracoes` (painel Master)                                      |
| **DELETE** | `/api/ControleAcessos/{idcontrole}`                                | Remover solicitação (Master)                      | ✅          | `controleAcessoService.remove`                                                |

---

## Endereço (pré-requisito de pagamento Bixs)

| Método    | Rota                       | Status FE | Onde                                                                                                 |
| :-------- | :------------------------- | :-------- | :--------------------------------------------------------------------------------------------------- |
| **POST**  | `/api/v1/Endereco/usuario` | ✅        | Cadastro cliente (`Register` step Endereço → `Activate`) + gate `RequireAddressDialog` em pagamentos |
| **POST**  | `/api/v1/Endereco/empresa` | ✅        | Cadastro business (step Endereço → após criar empresa em `Activate`)                                 |
| **PATCH** | `/api/v1/Endereco/{id}`    | ✅        | `#/configuracoes` e `#/business/configuracoes` (aba Endereço) via `enderecoService.update` / `saveForScope` |

Arquivos: `features/address/*`, steps em `Register.tsx` / `Activate.tsx`, gate
em `#/historico-servicos` e `#/pagamentos`. API **não** expõe GET de endereço; FE usa
flag de sessão + draft local + id após primeiro PATCH bem-sucedido.

---

## Catálogo — arquivos

| Camada   | Path                                                                                     |
| :------- | :--------------------------------------------------------------------------------------- |
| Schemas  | `features/catalog/schemas/catalogSchemas.ts`                                             |
| Services | `features/catalog/services/{categoria,servico,produto}Service.ts`                        |
| Hooks    | `useCategorias` / `useServicos` / `useProdutos` (admin) + `usePublicCatalog` (FE)        |
| Admin    | `#/business/categorias`, `#/business/produtos`, `#/business/servicos`                    |
| Vitrine  | `#/explorar` (abas Serviços/Produtos) + `#/empresa/:id` (`PublicCompanyCatalogSections`) |

Categorias agrupam **produtos e serviços**. Cobrança avulsa pode vincular ids
opcionais de catálogo em `#/business/pagamento-unico`.

---

## Pagamentos — papéis

| Ação                                      | Admin | Cliente          |
| :---------------------------------------- | :---- | :--------------- |
| Criar cobrança                            | Sim   | Não              |
| Pagar cobrança avulsa (`unico-solicitar`) | —     | Sim (+ endereço) |
| Pagar mensalidade (`solicitar`)           | —     | Sim (+ endereço) |
| Cadastrar chave PIX (PIX na caixa)        | Sim   | Não              |
| Solicitar integração Bixs               | Sim   | Não              |

**`MetodoPagamento` (enum C#):** `PIX`, `Cartao`, `Boleto`, `Transferencia`, `Dinheiro`, `BoletoPix`, `PixCaixa` (índice 6). O FE mapeia em `features/single-payment/schemas/cobrancaSchemas.ts`.

---

## Endpoints de conta / financeiro / bloqueios (integrados)

### Financeiro / pagamentos

| Método     | Rota                                                    | Papel          | Onde no FE                                              |
| :--------- | :------------------------------------------------------ | :------------- | :------------------------------------------------------ |
| **GET**    | `/api/v1/Pagamento/pendentes-repasse`                   | Admin          | `#/business/repasses`                                   |
| **POST**   | `/api/v1/Pagamento/{idPagamento}/confirmar-repasse`     | Admin          | `#/business/repasses`                                   |
| **GET**    | `/api/v1/Pagamento/Extrato`                             | Admin/Cliente  | `#/pagamentos` e `#/business/pagamentos`                |
| **GET**    | `/api/v1/Pagamento/Busca`                               | Admin/Cliente  | `#/pagamentos` e `#/business/pagamentos`                |
| **DELETE** | `/api/v1/Mensalidade/{id}/cancelar`                     | Admin          | `businessService.cancelarMensalidade`                   |
| **GET**    | `/api/v1/User/admin/relatorio-financeiro-pdf`           | Admin          | `#/business/relatorios`                                 |

### Conta / cartão / WhatsApp

| Método     | Rota                                         | Papel         | Onde no FE                                      |
| :--------- | :------------------------------------------- | :------------ | :---------------------------------------------- |
| **PATCH**  | `/api/v1/Endereco/{id}`                      | Auth          | Aba Endereço em configs (cliente e business)    |
| **POST**   | `/api/Cartao/resetar-padrao/{idUser}`        | Cliente       | `#/metodos-pagamento` (Limpar cartão padrão)    |
| **DELETE** | `/api/v1/User/{id}`                          | Auth          | `#/configuracoes` → Senha e Segurança           |
| **POST**   | `/api/v1/WhatsApps/EnviarMsg`                | Admin         | `#/business/whatsapp` (compose quando conectado)|

### Bloqueios (cliente)

| Método     | Rota                                          | Onde no FE                         |
| :--------- | :-------------------------------------------- | :--------------------------------- |
| **POST**   | `/api/UserBloqueio/empresa/{empresaId}`       | `#/bloqueios`                      |
| **DELETE** | `/api/UserBloqueio/empresa/{empresaId}`       | `#/bloqueios`                      |
| **POST**   | `/api/UserBloqueio/plano/{planoId}`           | `#/bloqueios`                      |
| **DELETE** | `/api/UserBloqueio/plano/{planoId}`           | `#/bloqueios`                      |
| **GET**    | `/api/UserBloqueio/meus-bloqueios/empresas`   | `#/bloqueios`                      |
| **GET**    | `/api/UserBloqueio/meus-bloqueios/planos`     | `#/bloqueios`                      |

Arquivos: `features/bloqueios/*`, página `#/bloqueios`.

---

## Fora de escopo do frontend

| Item | Motivo |
| :--- | :----- |
| `POST /api/v1/Pagamento/repasse-bixs/{idEmpresa}` | Webhook chamado pela Bixs, não pelo FE |
| `GET /api/Servicos` e `GET /api/Categorias` | Dump cross-tenant; vitrine usa rotas `*-publico` |
| `/api/zTemporario/dev/*` | Só ambiente de desenvolvimento / diagnóstico |
| Agendamentos (`features/services` mock) | Sem endpoints de agenda na API |
| `POST /api/v1/User/conecta-admin/{id}` | Fluxo interno admin↔cliente; não é tela de produto |
| `DELETE /api/v1/Empresa/{id}` | Operação destrutiva administrativa; fora do escopo atual do FE |
