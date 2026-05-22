# Relatório de Sincronização de Endpoints — PagWebV1

**Gerado em:** 21 de maio de 2026, ~19:08 (horário local)  
**Ferramenta MCP:** `sincronizar_endpoints_api`  
**Servidor MCP:** `pagwebv1` (`1b701ad2-2d9c-49fb-92f6-2259eb998eda`)

---

## Resultado desta execução

| Métrica                                 | Valor                      |
| --------------------------------------- | -------------------------- |
| Data/hora (UTC)                         | `2026-05-21T22:08:32.576Z` |
| Total de endpoints no Swagger           | **75**                     |
| Endpoints adicionados                   | **0**                      |
| Endpoints removidos                     | **0**                      |
| Endpoints modificados (relatório bruto) | **75**                     |

### Conclusão

**Nenhuma alteração funcional nova foi detectada nesta sincronização.**

Os 75 endpoints marcados como "modificados" apresentam parâmetros idênticos
antes e depois (ex.: `[body]` → `[body]`, `[ano,mes]` → `[ano,mes]`). Trata-se
de **re-sincronização de metadados** no servidor MCP, sem novas rotas, remoções
ou mudanças reais de contrato no Swagger.

---

## Última atualização com impacto real

A última sincronização que introduziu mudanças relevantes na API foi:

| Campo                | Valor                      |
| -------------------- | -------------------------- |
| Data/hora (UTC)      | `2026-05-21T21:59:39.320Z` |
| Data/hora (local)    | **21/05/2026, 18:59:31**   |
| Endpoints no Swagger | 75                         |
| Adicionados          | **1**                      |
| Modificados          | 74                         |
| Removidos            | 0                          |

### Endpoint adicionado na última atualização relevante

| Método | Rota                        | Operation ID                   |
| ------ | --------------------------- | ------------------------------ |
| `GET`  | `/api/v1/Pagamento/Extrato` | `get_api_v1_Pagamento_Extrato` |

**Parâmetros:** `ano`, `mes` (query)

### Alteração de contrato identificada na mesma sincronização

| Método | Rota                                   | Mudança                                                                |
| ------ | -------------------------------------- | ---------------------------------------------------------------------- |
| `POST` | `/api/v1/User/assinar-plano/{idPlano}` | Parâmetro renomeado de `tipoDesconto` para `TipoDesconto` (PascalCase) |

---

## Histórico recente de sincronizações

| #   | Data (local)     | Adicionados | Modificados | Removidos | Observação                                               |
| --- | ---------------- | ----------- | ----------- | --------- | -------------------------------------------------------- |
| 1   | 21/05/2026 19:08 | 0           | 75          | 0         | **Esta execução** — sem mudanças reais                   |
| 2   | 21/05/2026 18:59 | **1**       | 74          | 0         | **Última com impacto** — `GET /api/v1/Pagamento/Extrato` |
| 3   | 20/05/2026 14:41 | 0           | 74          | 0         | Re-sync de metadados                                     |
| 4   | 20/05/2026 14:36 | **1**       | 73          | 0         | Adicionado `GET /api/v1/Empresa`                         |
| 5   | 19/05/2026 22:12 | 0           | 73          | 0         | Re-sync de metadados                                     |
| 6   | 19/05/2026 14:44 | 0           | **6**       | 0         | Ajustes reais em Empresa, Plano e User                   |
| 7   | 18/05/2026 16:56 | 0           | 73          | 0         | Re-sync de metadados                                     |
| 8   | 18/05/2026 16:55 | 0           | 0           | 0         | Swagger já alinhado                                      |
| 9   | 18/05/2026 16:54 | 0           | 0           | 0         | Swagger já alinhado                                      |
| 10  | 18/05/2026 16:53 | 0           | 0           | 0         | Swagger já alinhado                                      |

---

## Estado atual do catálogo

- **75 rotas** registradas no MCP, alinhadas ao Swagger/OpenAPI do PagWebV1.
- **Nenhuma rota removida** desde o início do histórico consultado.
- Principais módulos cobertos: Assinatura, Cartão, Empresa, Endereço,
  Mensalidade, Notificação, Pagamento, Plano, User, UserBloqueio, WhatsApps e
  endpoints de desenvolvimento (`/api/zTemporario/dev/*`).

---

## Recomendações

1. **Integração frontend:** se for consumir extrato de pagamentos, usar o
   endpoint `GET /api/v1/Pagamento/Extrato` com query params `ano` e `mes` —
   disponível desde 21/05/2026.
2. **Assinatura de plano:** ao chamar
   `POST /api/v1/User/assinar-plano/{idPlano}`, enviar `TipoDesconto`
   (PascalCase), não `tipoDesconto`.
3. **Próximas sincronizações:** quando o relatório mostrar 0 adicionados/0
   removidos e parâmetros iguais, pode ignorar — o Swagger não mudou desde a
   última sync relevante.

---

_Relatório gerado automaticamente via MCP `pagwebv1` no workspace
PagWebFuncional._
