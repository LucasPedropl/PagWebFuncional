# Notas — agente Cursor (endereço + pagamento único)

Escopo deste agente: `features/address/**`, `features/single-payment/**`, `app/(user)/Dashboard.tsx`, `app/(user)/PagamentoUnicoCliente.tsx`, `app/(user)/Configuracoes.tsx`, `app/(business)/PagamentoUnico.tsx`, este arquivo.

Não toquei em `api/`, `features/billing-rules/**`, `app/(business)/Configuracoes.tsx`, `components/layout/**` nem `components/ui/**`.

---

## O que mudou, arquivo a arquivo

### Endereço (item 2.1)

- `features/address/schemas/enderecoSchemas.ts` — `complemento` opcional (máx. 80); entity aceita id em vários casings; estado de persistência separado; erro `AddressAlreadyExistsWithoutIdError` (não é mais sucesso).
- `features/address/utils/extractAddressId.ts` — extrai `idEndereco` / `IdEndereco` / `id` de objeto, número ou JSON em string.
- `features/address/services/enderecoService.ts` — POST/PATCH gravam o id quando a resposta traz; rascunho local ≠ flag de gravado no servidor; 400 de cadastro 1:1 **não** é tratado como sucesso.
- `features/address/hooks/useAddressForm.ts` — save com toast de erro; formulário permanece dirty se o servidor recusou.
- `features/address/components/AddressSettingsPanel.tsx` — consome o hook; aviso curto quando não há id neste dispositivo.
- `features/address/components/EnderecoFormFields.tsx` — campo Complemento depois do Número + nota discreta (não vai para a tabela `Enderecos` ainda).
- `features/address/components/RequireAddressDialog.tsx` — erro sobe para toast + texto no modal; não chama `onResolved` se o write falhou.
- `app/(user)/Configuracoes.tsx` — sem mudança de lógica; já renderiza `AddressSettingsPanel`.

### Cobrança avulsa / vencimento / status (item 2.2)

- `features/single-payment/schemas/cobrancaSchemas.ts` — `dataVencimento` obrigatória, não pode ser no passado; `Cobranca` aceita `dataVencimento`/`vencimento` se a API um dia devolver.
- `features/single-payment/services/cobrancaService.ts` — envia `dataVencimento` e `vencimento` no POST (hoje a API ignora).
- `features/single-payment/services/localSinglePaymentStore.ts` — persiste vencimento no mesmo padrão localStorage; reconcilia por `idUser + valorTotal + descricao` quando o POST só devolve texto.
- `features/single-payment/utils/deriveCobrancaDisplayStatus.ts` — **única** função pura de status exibido (API + vencimento local). Não muta o status da API.
- `features/single-payment/utils/cobrancaPresentation.ts` — junta vencimento, status derivado e `calculateLateCharges`.
- `features/single-payment/components/CobrancaForm.tsx` — campo obrigatório Data de vencimento.
- `features/single-payment/hooks/useCobrancas.ts` / `useUserCobrancas.ts` — grava/reconcilia vencimento após create/list.

### Cards interativos + filtro único (itens 1.2 e 4.1.1)

- `features/single-payment/types/cobrancaStatusFilter.ts` — `todos | emitido | pago | pendente | atrasado`.
- `features/single-payment/hooks/useCobrancaListingFilter.ts` — estado único, query `?status=`, scroll só se a listagem estiver fora da viewport.
- `features/single-payment/components/CobrancaStatCard.tsx` / `CobrancaStats.tsx` — cards viram `<button>` com `aria-pressed` e anel de foco **somente** se `onFilterChange` existir; sem a prop, inertes como antes.
- `features/single-payment/components/CobrancaTable.tsx` — o select de status é o mesmo estado dos cards; faixa “Filtro ativo” com limpar.
- `app/(user)/PagamentoUnicoCliente.tsx` e `app/(business)/PagamentoUnico.tsx` — ligam cards + tabela + URL.
- `app/(user)/Dashboard.tsx` — KPI Total Pendente é botão e navega para `/pagamento-unico?status=pendente`.

### Multa/juros na UI (item 4.1.3)

- `features/single-payment/components/CobrancaAmountCell.tsx` — original + multa + juros + dias + total.
- `features/single-payment/components/CobrancaPayDialogs.tsx` — mesmo breakdown no diálogo de pagamento, com aviso de que o gateway ainda usa `Cobranca.ValorTotal`.

---

## O que deliberadamente NÃO foi feito

- Não alterei `api/` (regra do workspace).
- Não alterei `features/billing-rules/**` (contrato fixo; só importei).
- Não pedi mudança em `components/ui` — `InfoTooltip` é `div`, cabe dentro do botão do card.
- Não inventei GET de endereço no frontend: a API não tem endpoint. Sem id no dispositivo, a edição **falha de forma visível**.
- Não envio o valor recalculado em `POST /api/v1/Pagamento/unico-solicitar` — o DTO só aceita `idCobranca` + `metodo`; o backend lê `Cobranca.ValorTotal`.
- `window.confirm` no cancelar da tabela ficou (não é `alert()`; troca por modal ficaria para outro ciclo).
- Reconciliação de vencimento sem id: se duas cobranças tiverem o mesmo cliente + valor + descrição no mesmo instante, o vencimento local pode colar na de id mais alto. Limitação do POST que devolve só texto.

---

## Mudanças obrigatórias no backend (`api/`, somente leitura daqui)

### 1. Endereço — raiz do save silencioso

**Tabela `Enderecos`**

- Coluna nova: `Complemento` (`nvarchar(80)` null).
- Model `api/PagWebV1/Models/Endereco.cs`: propriedade `complemento` (mesmo casing das outras: `rua`, `numero`, …).

**DTOs** `api/PagWebV1/Dtos/EnderecoDtos.cs`

- `EnderecoInputDto`: `public string? complemento { get; set; }`
- `EnderecoUpdateDto`: `public string? complemento { get; set; }`

**Controller** `api/PagWebV1/Controllers/EnderecoController.cs`

- `CreateEndUser` (~L36) e `CreateEndEmpresa` (~L61): mapear `complemento = dto.complemento`.
- `Update` (~L84–89): `endereco.complemento = dto.complemento ?? endereco.complemento`.
- `CreateEndEmpresa` hoje devolve `Ok("Endereço vinculado à empresa.")` (string, L67). Devolver o objeto `endereco` como o POST `/usuario` (L42), senão o frontend nunca recebe `IdEndereco` da empresa.
- O `catch` de `CreateEndUser` (L44–48) engole unique 1:1 e devolve 400 genérico. Melhor: 409 com o `IdEndereco` existente.

**GET que falta (correção de verdade do id)**

- `GET /api/v1/Endereco/usuario` — endereço do usuário logado (`EnderecoUsers` pelo `ClaimTypes.NameIdentifier`), 404 se não houver.
- `GET /api/v1/Endereco/empresa` — idem via vínculo admin → empresa (`EnderecoEmpresas`).
- Sem isso, login em outro browser/dispositivo não consegue PATCH.

`EnderecoUser` é 1:1 (chave composta em `AppDbContext`); segundo POST `/usuario` continua inválido — o GET elimina a necessidade de POST-de-novo.

### 2. Cobrança — vencimento e status

**Tabela `Cobranca` / model** `api/PagWebV1/Models/Cobranca.cs`

- Coluna `DataVencimento` (`date` ou `datetime`, not null no create).
- Opcional mas recomendado: `CreatedAt`.

**DTO** `api/PagWebV1/Dtos/CobrancaDtos.cs` (`CobrancaDtosPost`)

- `public DateTime DataVencimento { get; set; }` (ou `DateOnly`).

**Controller** `api/PagWebV1/Controllers/CobrancasController.cs`

- `PostCobranca` (~L355–362): `DataVencimento = cobrancaDto.DataVencimento` (hoje força `Status = MensalidadeStatus.Aberto` e ignora o body extra).
- `PostCobranca` L446: hoje `return Ok("Cobrança criada com sucesso."+resultMessage);` — **devolver o objeto da cobrança com `Id`**. Sem isso o vencimento local depende de fingerprint.
- GETs `Empresa` (~L47), `Usuario` (~L101) e `{id}` (~L161/193): incluir `c.DataVencimento` no DTO anônimo.
- Status “A pagar / A receber / Atraso” hoje é só frontend. Se o backend for a fonte da verdade, um job/consulta deve passar `Aberto` → `Atrasado` depois do vencimento (enum: Aberto=0, Pago=1, Repassado=2, Atrasado=3, Cancelado=4).

### 3. Multa/juros no pagamento (item 4.1.3) — display-only até isto existir

`POST /api/v1/Pagamento/unico-solicitar` (`api/PagWebV1/Controllers/PagamentoController.cs` ~L175).

- Linha ~279: `Amount = (int)(cobra.ValorTotal * 100)` — usa só `Cobranca.ValorTotal`.
- Para o PIX/boleto bater com a UI: aplicar a mesma regra de `calculateLateCharges` (taxa padrão + multa % no 1º dia + juros ao mês pro rata die base 30) **antes** de mandar o amount ao gateway, usando `DataVencimento` + regras da empresa.
- Sem essa mudança, o cliente vê o total atualizado e o QR continua no valor original.

---

## Pedido ao agente de layout (`components/ui`)

Nada neste ciclo. Se no futuro o `InfoTooltip` virar `<button>`, os cards de KPI quebram (botão dentro de botão) — manter o trigger como `div` ou aceitar o tooltip fora do card.
