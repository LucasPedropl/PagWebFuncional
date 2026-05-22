---
trigger: always_on
---

## Regras Críticas do Workspace
1. **API do Sistema**: A pasta `/api` contém a API do sistema. Você pode usá-la apenas para consultas, mas **nunca**, em hipótese alguma, modifique-a. Ela serve estritamente para compreender o problema e os contratos.
2. **Arquitetura do Projeto**: Para obter detalhes profundos sobre o Frontend e o Backend (API) e todas as suas diretrizes, você **deve** chamar a ferramenta do MCP `pagwebv1`:
   - Use `listar_regras_projeto` para verificar as categorias disponíveis.
   - Use `obter_regras_projeto` informando a categoria (ex: `frontend`, `backend`) para ler o detalhamento arquitetural completo e alinhar-se com os padrões.

