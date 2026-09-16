# Notas de Implementação — Agente Antigravity

**Repositório:** `PagWebFuncional` (React 19 + TypeScript + Vite 6 + Tailwind v4)  
**Data:** 16/09/2026  

---

## 1. Alterações Realizadas por Arquivo

### 1.1 `components/layout/shell/shellUtils.ts`
- **Adicionado helper `isEmpresaDualAccount()`**: Encapsula a verificação de se o usuário logado possui perfil/vínculo de empresa (`sessionService.isEmpresaOwner() || user?.tipo === 'Empresa'`). centralizando a regra em uma única função no shellUtils para consumo pelos layouts e componentes da shell.

### 1.2 `components/layout/shell/ViewSwitcher.tsx`
- **Adaptação para perfil estritamente cliente**:
  - Utiliza `isEmpresaDualAccount()`. Caso o usuário seja um cliente estrito (`isDual === false`), desabilita a abertura do dropdown de alternância de ambiente (`onToggle` não é acionado, `ChevronsUpDown` é ocultado).
  - Garante que para o cliente estrito a identidade renderizada na sidebar/header seja estritamente a do usuário cliente (`displayName` do usuário e avatar/iniciais do perfil pessoal, nunca a logo de empresa).

### 1.3 `components/layout/shell/ViewSwitcherPanel.tsx`
- **Ocultação da opção "Estabelecimento"**:
  - Envolve a opção `SwitcherOption` de "Estabelecimento" com a checagem `isEmpresaDualAccount()`. Para clientes estritos, o menu de alternância não exibe a opção nem logos de estabelecimento.

### 1.4 `components/layout/UserLayout.tsx`
- **Sanitização de crome comercial no painel do cliente**:
  - Importa `isEmpresaDualAccount()` de `shellUtils.ts`.
  - Passa `companyProfile` como `null` para o `ViewSwitcher` e oculta a prop `viewSwitcher` no `AppTopHeader` (`viewSwitcher={isDualAccount ? ... : undefined}`) quando o usuário não possui conta dual de empresa.
  - Isso garante que o dropdown da foto/perfil no topo direito exiba apenas as opções pertinentes ao cliente (ex.: "Sair da conta"), eliminando resquícios do crome comercial/empresa para usuários estritamente clientes.

### 1.5 `features/billing-rules/hooks/useBillingRules.ts` (Novo Arquivo)
- **Hook customizado `useBillingRules`**:
  - Gerencia estado do formulário de regras de cobrança (`taxaPadraoPercent`, `multaAtrasoPercent`, `jurosAtrasoMesPercent`, `reguaCobranca`, `templateEmail`, `templateWhatsapp`).
  - Formata e aceita vírgula como separador decimal pt-BR para os valores percentuais.
  - Executa validação em tempo real contra o `BillingRulesSchema` (Zod), derivando mensagens de erro inline diretamente do schema oficial.
  - Controla o estado `isDirty` (comparando valores atuais com os salvos) e `isValid`.
  - Provê funções de persistência (`handleSave` via `billingRulesService.saveRules`) e restauração (`handleResetToDefault` com valores de `DEFAULT_BILLING_RULES`).

### 1.6 `features/billing-rules/components/BillingRulesPanel.tsx` (Novo Arquivo)
- **Painel "Regras de Cobrança"**:
  - Renderiza campos numéricos para Taxa Padrão, Multa por Atraso e Juros por Atraso com componentes `Input` e `InfoTooltip`.
  - Renderiza 4 seletores `Toggle` para a Régua de Cobrança (5 dias antes, 2 dias antes, No vencimento, Avisar sempre após vencimento).
  - Renderiza 2 áreas de texto `Textarea` para templates de e-mail e WhatsApp, com contadores dinâmicos de caracteres (`x / 2000` e `x / 1000`).
  - Inclui bloco de simulação dinâmica em tempo real (`calculateLateCharges`) demonstrando o impacto das regras configuradas em uma fatura de R$ 100,00 vencida há 10 dias (exibindo taxa, multa, juros pro rata die e valor total atualizado em BRL).
  - Exibe nota informativa discreta indicando que as regras são aplicadas nos cálculos do aplicativo e aguardam suporte do servidor para o disparo automático das réguas.
  - Botões de ação para "Restaurar padrões" e "Salvar Alterações" (desabilitado quando o formulário estiver limpo ou inválido).

### 1.7 `app/(business)/Configuracoes.tsx`
- **Nova aba "Regras de Cobrança"**:
  - Atualizado o tipo union `ConfiguracoesTab` e a constante `CONFIG_TAB_VALUES` incluindo `'regras-cobranca'`.
  - Adicionado botão de navegação na sidebar da página de configurações com ícone `Percent` e rótulo "Regras de Cobrança", mantendo o padrão exato das abas existentes (suporte a `?tab=regras-cobranca` na URL).
  - Renderização do componente `BillingRulesPanel` (passando o `idEmpresa` resolvido da sessão).

---

## 2. O que Deliberadamente NÃO Foi Feito e Raciocínio

1. **Alteração na API / Backend (.NET)**:
   - A pasta `api/` é estritamente de leitura conforme as regras do projeto. Nenhuma alteração foi realizada lá.
2. **Modificação nos Contratos Fixos (`features/billing-rules/schemas`, `services`, `utils`)**:
   - Conforme instruído no briefing, os arquivos `billingRulesSchemas.ts`, `billingRulesService.ts` e `lateCharges.ts` foram mantidos intactos e consumidos exatamente como definidos.
3. **Modificação nos componentes de cliente/pagamento único do outro agente**:
   - Não foram tocados os arquivos de `features/single-payment/**`, `app/(user)/**` ou `PagamentoUnico.tsx`.
4. **Resoluções de erros legados de TypeScript**:
   - Os 14 erros pré-existentes de TypeScript no projeto (`Button` prop `size`, `lucide` `title`, `import.meta.env`, `jsPDF`, `motion.Variants`) foram mantidos intactos por estarem fora do escopo.

---

## 3. Requisitos de Alterações no Backend (`api/`) para Suporte End-to-End

Para que as Regras de Cobrança e Réguas de Notificação funcionem de forma 100% persistida no banco de dados e automatizada no servidor, o backend em .NET (`api/`) precisa das seguintes implementações:

### 3.1 Banco de Dados / Tabelas & Colunas

1. **Nova Tabela `EmpresaRegrasCobranca` (ou colunas na tabela `Empresa`)**:
   - `IdEmpresa` (INT / FK -> Empresa.Id, PK)
   - `TaxaPadraoPercent` (DECIMAL(5,2), default `0.00`)
   - `MultaAtrasoPercent` (DECIMAL(5,2), default `2.00`)
   - `JurosAtrasoMesPercent` (DECIMAL(5,2), default `1.00`)
   - `Notificar5DiasAntes` (BIT/BOOLEAN, default `1`)
   - `Notificar2DiasAntes` (BIT/BOOLEAN, default `1`)
   - `NotificarNoVencimento` (BIT/BOOLEAN, default `1`)
   - `NotificarAposVencimento` (BIT/BOOLEAN, default `1`)
   - `TemplateEmail` (NVARCHAR(2000), NULL)
   - `TemplateWhatsapp` (NVARCHAR(1000), NULL)
   - `DataAtualizacao` (DATETIME)

2. **Alteração na Tabela `Cobranca` / `Mensalidade`**:
   - Garantir que todas as faturas possuam coluna `DataVencimento` (DATETIME/DATE) persistida para cálculo exato de dias de atraso no worker do servidor.

### 3.2 Endpoints HTTP / DTOs na API

1. **`GET /api/v1/Empresa/regras-cobranca`**:
   - **Autenticação:** Bearer Token (Perfil Empresa / Admin).
   - **Retorno (DTO):**
     ```json
     {
       "taxaPadraoPercent": 0.00,
       "multaAtrasoPercent": 2.00,
       "jurosAtrasoMesPercent": 1.00,
       "reguaCobranca": {
         "cincoDiasAntes": true,
         "doisDiasAntes": true,
         "noVencimento": true,
         "aposVencimento": true
       },
       "templateEmail": "string",
       "templateWhatsapp": "string"
     }
     ```

2. **`PUT /api/v1/Empresa/regras-cobranca`**:
   - **Autenticação:** Bearer Token (Perfil Empresa / Admin).
   - **Request Body (DTO):** `SaveBillingRulesInput` contendo os mesmos campos acima.
   - **Comportamento:** Valida faixas de 0-100%, persiste os dados para a empresa logada e retorna as regras atualizadas.

### 3.3 Serviços em Background no Servidor

1. **`MensalidadeAtrasadaWorker` / `MensalidadeNotifierService`**:
   - Atualizar os workers de envio para ler os parâmetros da tabela `EmpresaRegrasCobranca`.
   - Injetar os modelos de e-mail (`TemplateEmail`) e WhatsApp (`TemplateWhatsapp`) no corpo dos disparos automáticos.
   - Respeitar os sinalizadores da régua (`Notificar5DiasAntes`, `Notificar2DiasAntes`, `NotificarNoVencimento`, `NotificarAposVencimento`) antes de efetuar o envio.
